import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { GuardiaChatEspecifico, GuardiaChatUsuario, GuardiaMensajeChatEspecifico } from "../../../../lib/guardiasTipo";
import { connect } from "socket.io-client";

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
            const respuestaMensajes = chat.mensajes.map((mensaje) => {
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

export async function POST(request: Request) {
    try {
        const cuerpoPeticion = await request.json();
        const datosRequeridos = [
            { key: "usuario", error: "usuario es un dato obligatorio" },
            { key: "participantes", error: "participantes es un dato obligatorio" },
            { key: "nombreChat", error: "nombreChat es un dato obligatorio" }
        ];
        // validación de la existencia de los datos necesarios
        for (let dato of datosRequeridos) {
            if (!cuerpoPeticion[dato.key]) return NextResponse.json({ error: dato.error }, { status: 400 });
        }
        if (!Array.isArray(cuerpoPeticion.participantes) || cuerpoPeticion.participantes.length < 1) {
            return NextResponse.json(
                { error: "participantes debe ser un array de longitud superior a 0" },
                { status: 400 }
            );
        }
        const participantes: string[] = cuerpoPeticion.participantes;
        let participantesIds: number[] = [];
        const nombreChat: string = cuerpoPeticion.nombreChat;
        // validación de existencia de usuario en bbdd
        const usuarioExiste = await prisma.usuario.findUnique({
            where: {
                nombreUsuario: cuerpoPeticion.usuario
            }
        })
        if (!usuarioExiste) return NextResponse.json({ error: "usuario no encontrado" }, { status: 404 });
        // añadimos el id del usuario al array con ids
        participantesIds.push(usuarioExiste.id);
        // validación de existencia de los usuarios en bbdd del array de participantes
        for (let participante of participantes) {
            let participanteExiste = await prisma.usuario.findUnique({
                where: {
                    nombreUsuario: participante
                }
            })
            if (!participanteExiste) return NextResponse.json({ error: "participante no encontrado" }, { status: 404 });
            if (!participantesIds.includes(participanteExiste.id)) participantesIds.push(participanteExiste.id);
        }
        // creación del nuevo chat
        const nuevoChat = await prisma.chats.create({
            data: {
                nombre: nombreChat,
                participantes: {
                    create: (participantesIds.map(usuarioId => ({
                        usuario: {
                            connect: { id: usuarioId }
                        }
                    })))
                }
            }
        })
        return NextResponse.json({ msg: nuevoChat }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}