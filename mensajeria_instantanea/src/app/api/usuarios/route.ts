import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(request:Request) {
    try {
        const { searchParams } = new URL(request.url);
        const usuarioParam = searchParams.get('usuario');
        let usuariosPorPagina = Number(searchParams.get('usuariosPorPagina') || 10);
        if (usuariosPorPagina > 51) usuariosPorPagina = 50;
        if (!usuarioParam) {
            const paginaParam = Number(searchParams.get('page') || 1);
            const [usuarios, pagina] = await Promise.all([
                prisma.usuario.findMany({
                    select: {
                        id: true,
                        nombreUsuario: true,
                    },
                    skip: (paginaParam - 1) * 10,
                    take: usuariosPorPagina
                }),
                prisma.usuario.count()
            ])
            return NextResponse.json({
                datos: usuarios,
                paginacion: {
                    paginaActual: paginaParam,
                    totalPaginas: Math.ceil(pagina / usuariosPorPagina)
                }
            })
        }
        let usuarioEspecifico = await prisma.usuario.findUnique({
            where: {
                nombreUsuario: usuarioParam
            },
            select: {
                id: true,
                nombreUsuario: true,
                email: true
            }
        })
        if (!usuarioEspecifico) return NextResponse.json({error: 'usuario no encontrado'}, {status: 404})
        return NextResponse.json(usuarioEspecifico);
    } catch (error) {
        return NextResponse.json(
            {error: 'Error al obtener usuarios'},
            {status: 500}
        )
    } finally {
        await prisma.$disconnect()
    }
}