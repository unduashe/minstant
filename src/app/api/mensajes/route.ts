import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pagina = Number(searchParams.get('pagina')) || 1;

        const mensajes = await prisma.mensajes.findMany({
            orderBy: {
                fechaEnvio: 'desc'
            },
            skip: (pagina - 1) * 10,
            take: 10,
        });

        return NextResponse.json(mensajes);

    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener mensajes" },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}