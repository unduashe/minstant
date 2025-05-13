import { z } from 'zod'

export const MensajeEsquema = z.object({
    contenido: z.string()
        .min(1, 'No se puede enviar un mensaje vacío')
        .max(4000, 'Máximo 4000 caracteres')
        .refine(value => value.trim().length > 0, {
            message: 'El mensaje no puede contener solo espacios',
        })
})

export const CuerpoChatEsquema = z.object({
    participantes: z.array(z.string()).min(1, 'participantes debe ser aun arreglo con más de un dato'),
    nombreChat: z.string().min(1).refine(value => value.trim().length > 0, {
        message: 'El nombre del chat no puede contener solo espacios'
    })
})

export const CreacionUsuarioEsquema = z.object({
    nombreUsuario: z.string().min(1).refine(value => value.trim().length > 0, {
        message: 'nombreUsuario es un dato obligatorio'
    }),
    email: z.string()
        .nullable()
        .optional()
        .refine(value => {
            if (value === undefined || value === null || value.trim() === "") return true;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        }, {
            message: 'Email no tiene un formato válido'
        }),
    contrasena: z.string().min(6).refine(value => value.trim().length > 5, {
        message: 'contrasena debe tener al menos 6 caracteres'
    })
})