export interface GuardiaRespuestaModeracion {
    esToxico: boolean,
    esAltamenteToxico: boolean,
    esAtaqueIdentidad: boolean,
    esInsulto: boolean,
    esAmenaza: boolean,
    puntuacionToxicidad?: number
}

export interface GuardiaChatEspecifico {
    id: number,
    nombre: string,
    fechaCreacion: Date,
    participantes: GuardiaChatEspecificoParticipantes[],
    mensajes: GuardiaMensajeChatEspecifico[],
    paginasMensajeTotales: number,
    paginaMensajeActual: number
}

export interface GuardiaChatEspecificoParticipantes {
    nombreUsuario: string | null,
    email: string | null
}

export interface GuardiaMensajeChatEspecifico {
    id: number,
    contenido: string,
    fechaEnvio: Date,
    editado: boolean,
    eliminado: boolean,
    contenidoOriginal: string | null,
    metadatos?: {nombreUsuarioAnonimo?: string, ip?: string} | null,
    autor: { nombreUsuario: string },
}

export interface GuardiaChatUsuario {
    id: number;
    nombre: string;
    fechaCreacion: Date;
    publico: boolean;
    participantes: GuardiaChatParticipantes[];
}

export interface GuardiaChatParticipantes {
    usuarioId: number | null;
    chatId: number | null;
    usuario: {
        nombreUsuario: string | null;
    };
}

export interface PeticionCrearChat {
    participantes: string[];
    nombreChat: string;
}