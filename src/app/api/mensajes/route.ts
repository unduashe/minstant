import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { MensajeEsquema } from '../../../../lib/esquemas';
import { moderadorContenido } from '../../../../lib/moderacion';
import { GuardiaMensajeChatEspecifico } from '../../../../lib/guardiasTipo';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../../../lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const paginaParam = Number(searchParams.get('pagina')) || 1;
        const chatIdParam = Number(searchParams.get('id'));
        // const usuarioParam = searchParams.get('usuario');
        const session = await getServerSession(authOptions);
        const usuarioId = Number(session?.user.id)
        let skipParam = 30;
        // if (paginaParam <= 1) {
        //     skipParam = Number(searchParams.get('skip') || 30);
        // }
        // else {
        //     skipParam = 30
        // }

        const chatExiste = await prisma.chats.findUnique({
            where: {
                id: chatIdParam
            },
            include: {
                participantes: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nombreUsuario: true
                            }
                        }
                    }
                }
            }
        })

        const participante = chatExiste?.participantes.some(participante => participante.usuario.id === usuarioId);
        const publico = chatExiste?.publico;
        // validación de que hayamos obtenido el chat y de que el usuario pueda obtener información del chat
        if (!chatExiste) return NextResponse.json({ error: "El chat solicitado no existe" }, { status: 404 });
        if (!participante && !publico) return NextResponse.json({ error: "No dispones de acceso al chat" }, { status: 403 });

        const [mensajes, pagina] = await Promise.all([
            prisma.mensajes.findMany({
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
                skip: (paginaParam - 1) * skipParam,
                take: skipParam,
            }),
            prisma.mensajes.count({
                where: {
                    chatId: chatIdParam
                }
            })

        ])
        // formateo de respuesta
        const respuestaMensajes = mensajes.map((mensaje) => {
            const respuestaMensaje: GuardiaMensajeChatEspecifico = {
                id: mensaje.id,
                contenido: mensaje.contenido,
                fechaEnvio: mensaje.fechaEnvio,
                editado: mensaje.editado,
                eliminado: mensaje.eliminado,
                contenidoOriginal: mensaje.contenidoOriginal,
                autor: mensaje.autor
            }
            return respuestaMensaje
        });

        const respuesta = {
            mensajes: respuestaMensajes,
            paginaActual: paginaParam,
            paginasTotales: Math.ceil(pagina / skipParam)
        }

        return NextResponse.json(respuesta);

    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener mensajes" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        // declaración de variables de datos a obtener
        const { searchParams } = new URL(request.url);
        const session = await getServerSession(authOptions);
        const usuarioId = Number(session?.user.id);
        const cuerpoPeticion = await request.json();
        // validación del cuerpo de la petición
        const validacionCuerpoPeticion = MensajeEsquema.safeParse(cuerpoPeticion);
        if (!validacionCuerpoPeticion.success) {
            return NextResponse.json({ error: validacionCuerpoPeticion.error }, { status: 400 });
        }
        // validación de obtención de id de chat
        const idParam = Number(searchParams.get('id'));
        if (!idParam || isNaN(idParam)) return NextResponse.json({ error: 'Es necesario indicar el parámetro id' }, { status: 400 });
        const mensaje = {
            contenido: validacionCuerpoPeticion.data.contenido,
            chatId: idParam,
            usuario: usuarioId
        }
        // validación de que el chat en el que se está intentando escribir extiste
        const chat = await prisma.chats.findUnique({
            where: { id: mensaje.chatId },
            include: {
                participantes: true
            }
        })
        if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });
        // validación de que el contenido del mensaje no sea tóxico
        const resultadoModeracion = await moderadorContenido(mensaje.contenido);
        if (Object.values(resultadoModeracion).includes(true)) return NextResponse.json(
            { error: 'El contenido del mensaje es inapropiado' },
            { status: 422 }
        );

        let autorId: number;
        let usuario;
        let nuevoMensaje
        // creación de mensaje según si el usuario es anonimo o esta logado
        if (usuarioId) {
            // validación de existencia de usuario
            usuario = await prisma.usuario.findUnique({
                where: { id: mensaje.usuario }
            })
            if (!usuario) return NextResponse.json(
                { error: 'El usuario con el que estás intentando enviar el mensaje no se encuentra, prueba a logarte nuevamente' },
                { status: 404 }
            )
            autorId = usuario.id
            // validación de que pueda escribir en el chat
            const esParticipante = chat.participantes.some((participante) => participante.usuarioId === autorId);
            if (!esParticipante && !chat.publico) return NextResponse.json({ error: 'No tienes acceso para participar en el chat' }, { status: 403 });
            // creación de la entrada en bbdd
            nuevoMensaje = await prisma.mensajes.create({
                data: {
                    contenido: mensaje.contenido,
                    contenidoOriginal: mensaje.contenido,
                    chatId: mensaje.chatId,
                    autorId: autorId
                },
                include: {
                    autor: {
                        select: { nombreUsuario: true }
                    }
                }
            });
        } else {
            // si no está logado hacemos uso del id reservado para usuarios anonimos, 0
            autorId = 0
            // validación de que pueda escribir en el chat
            if (!chat.publico) return NextResponse.json({ error: 'No tienes acceso para participar en el chat' }, { status: 403 });
            // creación de nombre aleatorio
            const nombreAnon = `anon${crypto.randomUUID().slice(0, 8)}`;
            try {
                // obtención de ip A REVISAR y creación de mensaje con metadatos
                const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
                nuevoMensaje = await prisma.mensajes.create({
                    data: {
                        contenido: mensaje.contenido,
                        contenidoOriginal: mensaje.contenido,
                        chatId: mensaje.chatId,
                        autorId: autorId,
                        metadatos: {
                            nombreUsuarioAnonimo: nombreAnon,
                            ip: ip
                        }
                    },
                    include: {
                        autor: {
                            select: { nombreUsuario: true }
                        }
                    }
                });
            } catch (error) {
                console.log(error)
            }
        }
        return NextResponse.json({ msg: nuevoMensaje }, { status: 201 })

    } catch (error) {
        return NextResponse.json(
            { error: error },
            { status: 500 }
        )
    } finally {
        prisma.$disconnect();
    }
}
