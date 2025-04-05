export async function moderadorContenido(texto:string) {
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
                  SEVERE_TOXICITY: {}
                }
              })
        });
        console.log("respuesta:",respuesta);
        const datos = await respuesta.json();
        console.log("datos:", datos);
        const puntuacion = datos.attributeScores;
        console.log("puntuacion:", puntuacion);
        

        return {
            esToxico: puntuacion.TOXICITY.summaryScore.value > 0.7,
            puntuacionToxicidad: puntuacion.TOXICITY.summaryScore.value
        }
    } catch (error) {
        console.log(error);
        return {esToxico: false, puntuacionToxicidad: 0} 
    }
}