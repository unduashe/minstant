import {z} from 'zod'

export const MensajeEsquema = z.object({
    contenido: z.string()
    .min(1, 'No se puede enviar un mensaje vacío')
    .max(4000, 'Máximo 4000 caracteres')
    .refine(value => value.trim().length > 0, {
        message: 'El mensaje no puede contener solo espacios',
    })
})