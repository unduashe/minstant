import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { CreacionUsuarioEsquema } from "../../../../lib/esquemas";

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const usuarioParam = searchParams.get('usuario');
        let usuariosPorPagina = Number(searchParams.get('usuariosPorPagina') || 10);
        if (usuariosPorPagina > 51) usuariosPorPagina = 50;
        if (!usuarioParam) {
            const paginaParam = Number(searchParams.get('pagina') || 1);
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
            ]);
            interface GuardiaUsuarios {
                id: number,
                nombreUsuario: string
            };
            interface GuardiaRespuestaUsuariosPagina {
                datos: GuardiaUsuarios[],
                paginacion: {
                    paginaActual: number,
                    totalPaginas: number
                }
            };
            return NextResponse.json<GuardiaRespuestaUsuariosPagina>({
                datos: usuarios,
                paginacion: {
                    paginaActual: paginaParam,
                    totalPaginas: Math.ceil(pagina / usuariosPorPagina)
                }
            });
        };
        let usuarioEspecifico = await prisma.usuario.findUnique({
            where: {
                nombreUsuario: usuarioParam
            },
            select: {
                id: true,
                nombreUsuario: true,
                email: true
            }
        });
        if (!usuarioEspecifico) return NextResponse.json({ error: 'usuario no encontrado' }, { status: 404 });
        interface GuardiaUsuarioEspecifico {
            id: number,
            nombreUsuario: string,
            email: string | null
        }
        return NextResponse.json<GuardiaUsuarioEspecifico>(usuarioEspecifico);
    } catch (error) {
        return NextResponse.json(
            { error: 'Error al obtener usuarios' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
    try {
        const datosPeticion = await request.json();
        // validación de la información recibida con zod
        const validacionCabeceraPeticion = CreacionUsuarioEsquema.safeParse(datosPeticion);
        if (!validacionCabeceraPeticion.success) {
            return NextResponse.json({ error: validacionCabeceraPeticion.error }, { status: 400 });
        }
        const {nombreUsuario, email, contrasena} = datosPeticion
        // validación de que el usuario no este repetido
        const usuarioExiste = await prisma.usuario.findUnique({
            where: {
                nombreUsuario: nombreUsuario
            }
        });
        if (usuarioExiste) return NextResponse.json(
            { error: 'usuario ya existe' },
            { status: 400 }
        );
        // hasheo de contraseña para guardarla encriptada
        const contrasenaHasheada = await hash(contrasena, 12)
        // creación del usuario
        const resultado = await prisma.usuario.create({
            data: {
                nombreUsuario: nombreUsuario,
                contrasena: contrasenaHasheada,
                email: email || null
            }
        })

        const respuesta = {
            id: resultado.id,
            nombreUsuario: resultado.nombreUsuario,
            email: resultado.email
        }
        return NextResponse.json({ msg: `usuario ${nombreUsuario} creado`,  "usuario": respuesta}, {status: 201})

    } catch (error) {
        return NextResponse.json(
            { error: 'Error al agregar usuario' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}