import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { MensajeEsquema } from '../../../../lib/esquemas';
import { moderadorContenido } from '../../../../lib/moderacion';
import { boolean } from 'zod';
import { GuardiaMensajeChatEspecifico } from '../../../../lib/guardiasTipo';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const paginaParam = Number(searchParams.get('pagina')) || 1;
        let skipParam = Number(searchParams.get('skip') || 30);
        const chatIdParam = Number(searchParams.get('id'));
        const usuarioParam = searchParams.get('usuario');

        const chatExiste = await prisma.chats.findUnique({
            where: {
                id: chatIdParam
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
            }
        })

        const participante = chatExiste?.participantes.some(participante => participante.usuario.nombreUsuario === usuarioParam);
        const publico = chatExiste?.publico;
        // validación de que hayamos obtenido el chat y de que el usuario pueda obtener información del chat
        if (!chatExiste) return NextResponse.json({ error: "El chat solicitado no existe" }, { status: 404 });
        if (!participante && !publico) return NextResponse.json({ error: "No dispones de acceso al chat" }, { status: 403 });

        const mensajes = await prisma.mensajes.findMany({
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
            take: 30,
        });
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
        })

        return NextResponse.json(respuestaMensajes);

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
        const cuerpoPeticion = await request.json();
        // validación del cuerpo de la petición
        const validacionCuerpoPeticion = MensajeEsquema.safeParse(cuerpoPeticion);
        if (!validacionCuerpoPeticion.success) {
            return NextResponse.json({ error: validacionCuerpoPeticion.error }, { status: 400 });
        }
        // validación de obtención de id
        const idParam = Number(searchParams.get('id'));
        const usuarioParam = searchParams.get('usuario') || undefined;
        if (!idParam || isNaN(idParam)) return NextResponse.json({ error: 'Es necesario indicar el parámetro id' }, { status: 400 });
        // validación de que la información recibida tiene el formato correcto
        interface GuardiaMensaje {
            contenido: string,
            chatId: number,
            usuario?: string | undefined
        }
        const mensaje: GuardiaMensaje = {
            contenido: validacionCuerpoPeticion.data.contenido,
            chatId: idParam,
            usuario: usuarioParam
        }
        // validación de que el chat en el que se está intentando escribir extiste
        const chat = await prisma.chats.findUnique({
            where: { id: mensaje.chatId },
            include: {
                participantes: true
            }
        })
        if (!chat) return NextResponse.json({ error: 'Chat no encontrado' }, { status: 404 });
        let autorId: number;
        let usuario;
        // validación de que el usuario informado que intenta agregar información existe
        if (mensaje.usuario && mensaje.usuario != 'null' || mensaje.usuario && mensaje.usuario != 'undefined') {
            usuario = await prisma.usuario.findUnique({
                where: { nombreUsuario: mensaje.usuario }
            })
            if (!usuario) return NextResponse.json(
                { error: 'El usuario con el que estás intentando enviar el mensaje no se encuentra, prueba a logarte nuevamente' },
                { status: 404 }
            )

        }
        // validación de que si no se informa usuario se crea uno, independientemente se asigna el autorId
        if (usuario) {
            autorId = usuario.id
        } else {
            const nombreAnon = `anon${crypto.randomUUID().slice(0, 8)}`;
            const nuevoUsuario = await prisma.usuario.create({
                data: {
                    nombreUsuario: nombreAnon
                }
            })
            autorId = nuevoUsuario.id
        }
        // validación de que el usuario puede escribir en el chat
        const esParticipante = chat.participantes.some((participante) => participante.usuarioId === autorId);
        if (!esParticipante && !chat.publico) return NextResponse.json({ error: 'No tienes acceso para participar en el chat' }, { status: 403 });
        // agregar participante al chat público si no existía
        if (!esParticipante && chat.publico) {
            await prisma.usuarioChats.create({
                data: {
                    usuarioId: autorId,
                    chatId: mensaje.chatId
                }
            })
        }
        // validación de que el contenido del mensaje no sea tóxico
        const resultadoModeracion = await moderadorContenido(mensaje.contenido);
        if (Object.values(resultadoModeracion).includes(true)) return NextResponse.json(
            { error: 'El contenido del mensaje es inapropiado' },
            { status: 422 }
        )
        // creación del mensaje
        const nuevoMensaje = await prisma.mensajes.create({
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