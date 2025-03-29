import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const chatIdParam = Number(searchParams.get('id'));
        // este dato se obtendrá del token guardado en local store que se implementará posteriormente
        const usuarioIdParam = Number(searchParams.get('user'));
        if (chatIdParam) {
            const chat = await prisma.chats.findUnique({
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
                        }
                    }
                }
            });
            if (!chat) return NextResponse.json({error: 'Chat no encontrado'}, {status: 404});
            const tieneAcceso = chat.publico || chat.participantes.length > 0;
            if (!tieneAcceso) return NextResponse.json({error: 'No tienes acceso al chat'}, {status: 403});
            const response = {
                id: chat.id,
                nombre: chat.nombre,
                fechaCreacion: chat.fechaCreacion,
                participantes: chat.participantes.map((participante) => participante.usuario),
                mensajes: chat.mensajes
            }
            return NextResponse.json(response)
        }
        // añadir bloque para devolver todos los chats del usuario logado
        if (!usuarioIdParam) {
            const {searchParams} = new URL(request.url)
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
            return NextResponse.json(chatsPublicos)
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
