import {z} from 'zod'

export const MensajeEsquema = z.object({
    contenido: z.string()
    .min(1, 'No se puede enviar un mensaje vacío')
    .max(4000, 'Máximo 4000 caracteres')
    .refine(value => value.trim().length > 0, {
        message: 'El mensaje no puede contener solo espacios',
    })
})

export const CuerpoChatEsquema = z.object({
    usuario: z.string().min(1, 'usuario es un dato obligatorio'),
    participantes: z.array(z.string()).min(1, 'participantes debe ser aun arreglo con más de un dato'),
    nombreChat: z.string().min(1).refine(value => value.trim().length > 0, {
        message: 'El nombre del chat no puede contener solo espacios'
    })
})