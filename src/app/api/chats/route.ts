import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { GuardiaChatEspecifico, GuardiaChatUsuario, GuardiaMensajeChatEspecifico } from "../../../../lib/guardiasTipo";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatIdParam = Number(searchParams.get('id'));
        const paginaParam = Number(searchParams.get('pagina') || 1);
        const skipParam = Number(searchParams.get('skip') || 30)
        // este dato se obtendrá del token guardado en local store que se implementará posteriormente
        const usuarioParam = searchParams.get('usuario');
        
        
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
                            orderBy: {
                                id: 'desc'
                            },
                            include: {
                                autor: {
                                    select: {
                                        nombreUsuario: true
                                    }
                                }
                            },
                            skip: (paginaParam - 1) * skipParam,
                            take: skipParam
                        }
                    }
                }),
                prisma.mensajes.count({
                    where: {
                        chatId: chatIdParam
                    }
                })
            ])
            
            if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });
            const tieneAcceso = chat.publico || chat.participantes.some((participante) => participante.usuario.nombreUsuario === usuarioParam);
            if (!tieneAcceso) return NextResponse.json({ error: 'No tienes acceso al chat' }, { status: 403 });
            const respuestaMensajes= chat.mensajes.map((mensaje) => {
                const respuestaMensaje: GuardiaMensajeChatEspecifico = {
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
                paginasMensajeTotales: Math.ceil(pagina / skipParam),
                paginaMensajeActual: paginaParam
            }
            return NextResponse.json<GuardiaChatEspecifico>(response)
        }
        // añadir bloque para devolver todos los chats del usuario logado
        if (!usuarioParam || !chatIdParam) {
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
            // interface GuardiaChatPublico {
            //     id: number;
            //     nombre: string;
            //     fechaCreacion: Date;
            //     publico: boolean;
            //     participantes: {
            //         usuarioId: number | null;
            //         chatId: number | null;
            //         usuario: {
            //             nombreUsuario: string | null;
            //         };
            //     }[];
            // }

            return NextResponse.json<GuardiaChatUsuario[]>(chatsPublicos)
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
