import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from 'bcryptjs';
import { PrismaClient } from "@prisma/client";
import type { NextAuthOptions } from 'next-auth';

const prisma = new PrismaClient();
// interfaces para usuario y sesión para ts
declare module "next-auth" {
    interface User {
      id: string;
      role?: string;
    }
  
    interface Session {
      user: User & {
        id: string;
        role?: string;
      };
    }
  }

export const authOptions: NextAuthOptions = {
    // inicializador de adaptador de prisma
    adapter: PrismaAdapter(prisma),
    // proveedores, solo se usa el proveedor de credenciales almacenadas en bbdd
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                nombreUsuario: { label: "nombre_usuario", type: "text" },
                contrasena: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                // validación de recibir usuario y contraseña para el login
                if (!credentials?.nombreUsuario || !credentials?.contrasena) {
                    throw new Error('Usuario y contraseña son requeridos');
                }
                // validación de que el usuario exista y las credenciales sean correctas
                const usuario = await prisma.usuario.findUnique({
                    where: { nombreUsuario: credentials.nombreUsuario }
                });
                if (!usuario) {
                    throw new Error('Usuario o contraseña incorrectos');
                }
                if (!usuario.contrasena) {
                    throw new Error('Contraseña es requerida')
                }
                const isValid = await compare(credentials.contrasena, usuario.contrasena);
                if (!isValid) {
                    throw new Error('Usuario o contraseña incorrectos');
                }

                return {
                    id: usuario.id.toString(),
                    name: usuario.nombreUsuario,
                    email: usuario.email || null
                };
            }
        })
    ],

    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, 
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id;
                token.role = 'user';
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.userId as string;
            session.user.role = token.role as string | undefined;
            return session;
        }
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};