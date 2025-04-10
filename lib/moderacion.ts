import { GuardiaRespuestaModeracion } from "./guardiasTipo";

export async function moderadorContenido(texto:string):Promise<GuardiaRespuestaModeracion> {
    const API_KEY = process.env.API_KEY_PERSPECTIVE;
    if (!API_KEY) throw new Error('Falta por definir API_KEY_PERSPECTIVE en el archivo .env');
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${API_KEY}`;

    try {
        const respuesta = await fetch(`${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                comment: { text: texto },
                requestedAttributes: {
                  TOXICITY: {},
                  SEVERE_TOXICITY: {},
                  IDENTITY_ATTACK: {},
                  INSULT: {},
                  THREAT: {},
                }
              })
        });
        const datos = await respuesta.json();
        const puntuacion = await datos.attributeScores;
        if (!puntuacion) return {
            esToxico: false,
            esAltamenteToxico: false,
            esAtaqueIdentidad: false,
            esInsulto: false,
            esAmenaza: false
        }
        
        return {
            esToxico: puntuacion.TOXICITY.summaryScore.value > 0.7,
            esAltamenteToxico: puntuacion.SEVERE_TOXICITY.summaryScore.value > 0.6,
            esAtaqueIdentidad: puntuacion.IDENTITY_ATTACK.summaryScore.value > 0.7,
            esInsulto: puntuacion.INSULT.summaryScore.value > 0.7,
            esAmenaza: puntuacion.THREAT.summaryScore.value > 0.6
        }
    } catch (error) {
        console.log(error);
        return {esToxico: false, esAltamenteToxico: false, esAtaqueIdentidad: false, esInsulto: false, esAmenaza: false} 
    }
}