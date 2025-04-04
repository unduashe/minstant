import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatIdParam = Number(searchParams.get('id'));
        const paginaParam = Number(searchParams.get('pagina') || 1);
        // este dato se obtendrá del token guardado en local store que se implementará posteriormente
        const usuarioIdParam = Number(searchParams.get('user'));
        if (chatIdParam) {
            const [chat, pagina] = await Promise.all([
                prisma.chats.findUnique({
                    where: {
                        id: chatIdParam,
                    },
                    include: {
                        participantes: {
                            include: {
                                usuario: {
                                    select: {
                                        nombreUsuario: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        mensajes: {
                            include: {
                                autor: {
                                    select: {
                                        nombreUsuario: true
                                    }
                                }
                            },
                            skip: (paginaParam - 1) * 20,
                            take: 20
                        }
                    }
                }),
                prisma.mensajes.count({
                    where: {
                        id: chatIdParam
                    }
                })
            ])
            if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });
            const tieneAcceso = chat.publico || chat.participantes.length > 0;
            if (!tieneAcceso) return NextResponse.json({ error: 'No tienes acceso al chat' }, { status: 403 });
            const respuestaMensajes= chat.mensajes.map((mensaje) => {
                interface GuardiaRespuestaMensaje {
                    id: number,
                    contenido: string,
                    fechaEnvio: Date,
                    editado: boolean,
                    eliminado: boolean,
                    contenidoOriginal: string | null,
                    autor: {
                        nombreUsuario: string
                    }
                };
                const respuestaMensaje: GuardiaRespuestaMensaje = {
                    id: mensaje.id,
                    contenido: mensaje.contenido,
                    fechaEnvio: mensaje.fechaEnvio,
                    editado: mensaje.editado,
                    eliminado: mensaje.eliminado,
                    contenidoOriginal: mensaje.contenidoOriginal,
                    autor: mensaje.autor
                };
                return respuestaMensaje
            })
            const response = {
                id: chat.id,
                nombre: chat.nombre,
                fechaCreacion: chat.fechaCreacion,
                participantes: chat.participantes.map((participante) => participante.usuario),
                mensajes: respuestaMensajes,
                paginasMensajeTotales: Math.ceil(pagina / 20),
                paginaMensajeActual: paginaParam
            }
            interface GuardiaChatEspecifico {
                id: number,
                nombre: string,
                fechaCreacion: Date,
                participantes: {
                    nombreUsuario: string | null,
                    email: string | null
                }[],
                mensajes: any[],
                paginasMensajeTotales: number,
                paginaMensajeActual: number
            }
            return NextResponse.json<GuardiaChatEspecifico>(response)
        }
        // añadir bloque para devolver todos los chats del usuario logado
        if (!usuarioIdParam) {
            const { searchParams } = new URL(request.url)
            const paginacion = Number(searchParams.get('pagina') || 1)
            const chatsPublicos = await prisma.chats.findMany({
                where: {
                    publico: true
                },
                include: {
                    participantes: {
                        include: {
                            usuario: {
                                select: {
                                    nombreUsuario: true
                                }
                            }
                        }
                    }
                },
                skip: (paginacion - 1) * 20,
                take: 20
            })
            interface GuardiaChatPublico {
                id: number;
                nombre: string;
                fechaCreacion: Date;
                publico: boolean;
                participantes: {
                    usuarioId: number | null;
                    chatId: number | null;
                    usuario: {
                        nombreUsuario: string | null;
                    };
                }[];
            }

            return NextResponse.json<GuardiaChatPublico[]>(chatsPublicos)
        }

    } catch (error) {
        return NextResponse.json(
            { error: error },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}
