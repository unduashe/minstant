export interface GuardiaRespuestaModeracion {
    esToxico: boolean,
    esAltamenteToxico: boolean,
    esAtaqueIdentidad: boolean,
    esInsulto: boolean,
    esAmenaza: boolean,
    puntuacionToxicidad?: number
}