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
                        where: {usuarioId: usuarioIdParam || 0},
                        select: {usuarioId: true}
                    }
                }
            });
            if (!chat) return NextResponse.json({error: 'Chat no encontrado'}, {status: 404});
            const tieneAcceso = chat.publico || chat.participantes.length > 0;
            if (!tieneAcceso) return NextResponse.json({error: 'No tienes acceso al chat'}, {status: 403});
        }
        // añadir bloque para devolver todos los chats del usuario logado
        if (!usuarioIdParam) {
            const chatsPublicos = await prisma.chats.findMany({
                where: {
                    publico: true
                }
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