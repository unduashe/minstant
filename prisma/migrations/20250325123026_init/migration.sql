-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('IMAGEN', 'VIDEO', 'DOCUMENTO', 'AUDIO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombreUsuario" TEXT NOT NULL,
    "email" TEXT,
    "contrasena" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chats" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mensajes" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "fechaEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,
    "contenidoOriginal" TEXT,
    "autorId" INTEGER NOT NULL,
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "Mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Archivos" (
    "id" SERIAL NOT NULL,
    "tipoArchivo" "TipoArchivo",
    "nombreArchivo" TEXT NOT NULL,
    "rutaArchivo" TEXT NOT NULL,
    "tamaño" DECIMAL(65,30),
    "fotoPerfilId" INTEGER,

    CONSTRAINT "Archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificaciones" (
    "id" SERIAL NOT NULL,
    "leido" BOOLEAN DEFAULT false,
    "entregado" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER NOT NULL,
    "mensajeId" INTEGER,

    CONSTRAINT "Notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioChats" (
    "usuarioId" INTEGER NOT NULL,
    "chatId" INTEGER NOT NULL,

    CONSTRAINT "UsuarioChats_pkey" PRIMARY KEY ("usuarioId","chatId")
);

-- CreateTable
CREATE TABLE "MensajesArchivos" (
    "mensajeId" INTEGER NOT NULL,
    "archivoId" INTEGER NOT NULL,

    CONSTRAINT "MensajesArchivos_pkey" PRIMARY KEY ("mensajeId","archivoId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_nombreUsuario_key" ON "Usuario"("nombreUsuario");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Archivos_fotoPerfilId_key" ON "Archivos"("fotoPerfilId");

-- AddForeignKey
ALTER TABLE "Mensajes" ADD CONSTRAINT "Mensajes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensajes" ADD CONSTRAINT "Mensajes_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Archivos" ADD CONSTRAINT "Archivos_fotoPerfilId_fkey" FOREIGN KEY ("fotoPerfilId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificaciones" ADD CONSTRAINT "Notificaciones_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "Mensajes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioChats" ADD CONSTRAINT "UsuarioChats_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioChats" ADD CONSTRAINT "UsuarioChats_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajesArchivos" ADD CONSTRAINT "MensajesArchivos_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "Mensajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajesArchivos" ADD CONSTRAINT "MensajesArchivos_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "Archivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
