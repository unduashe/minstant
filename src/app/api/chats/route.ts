import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { GuardiaChatEspecifico, GuardiaChatUsuario, GuardiaMensajeChatEspecifico, PeticionCrearChat } from "../../../../lib/guardiasTipo";
import { CuerpoChatEsquema } from "../../../../lib/esquemas";
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatIdParam = Number(searchParams.get('id'));
        const paginaParam = Number(searchParams.get('pagina') || 1);
        // const skipParam = Number(searchParams.get('skip') || 30)
        // este dato se obtendrá del token guardado en local store que se implementará posteriormente
        // const usuarioParam = searchParams.get('usuario');
        const session = await getServerSession(authOptions);
        const usuarioId = Number(session?.user?.id);


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
                                        id: true,
                                        nombreUsuario: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        mensajes: {
                            orderBy: {
                                fechaEnvio: 'desc'
                            },
                            include: {
                                autor: {
                                    select: {
                                        nombreUsuario: true
                                    }
                                }
                            },
                            skip: (paginaParam - 1) * 30,
                            take: 30
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
            const tieneAcceso = chat.publico || chat.participantes.some((participante) => participante.usuario.id === usuarioId);
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
                paginasMensajeTotales: Math.ceil(pagina / 30),
                paginaMensajeActual: paginaParam
            }
            return NextResponse.json<GuardiaChatEspecifico>(response)
        }
        // añadir bloque para devolver todos los chats del usuario logado
        if (usuarioId) {
            // const {searchParams} = new URL(request.url)
            const paginacion = Number(searchParams.get('pagina') || 1);
            const chatsUsuario = await prisma.chats.findMany({
                where: {
                    OR: [
                        { publico: true },
                        { participantes: { some: { usuarioId } } }
                    ]
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
            return NextResponse.json<GuardiaChatUsuario[]>(chatsUsuario)
        }
        if (!usuarioId) {
            // const { searchParams } = new URL(request.url)
            const paginacion = Number(searchParams.get('pagina') || 1);
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
        const cuerpoPeticion: PeticionCrearChat = await request.json();
        const session = await getServerSession(authOptions);
        const usuarioId = Number(session?.user?.id);
        const validacionCuerpoPeticion = CuerpoChatEsquema.safeParse(cuerpoPeticion);
        if (!usuarioId) return NextResponse.json(
            {error: 'Debes estar logado para realizar esta acción, por favor logate con tu usuario'},
            {status: 403}
        );
        if (!validacionCuerpoPeticion.success) {
            return NextResponse.json({ error: validacionCuerpoPeticion.error }, { status: 400 });
        }
        const participantes: string[] = cuerpoPeticion.participantes;
        let participantesIds: number[] = [];
        const nombreChat: string = cuerpoPeticion.nombreChat;
        // validación de existencia de usuario en bbdd
        const usuarioExiste = await prisma.usuario.findUnique({
            where: {
                id: usuarioId
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
            if (!participanteExiste) return NextResponse.json({ error: `${participante} no encontrado en la bbdd` }, { status: 404 });
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
            { error: "Error interno del servidor" },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}