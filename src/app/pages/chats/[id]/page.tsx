"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useRef } from "react";

function ChatPage() {
    let params = useParams();
    let [chat, setChat] = useState([]);
    let [mensaje, setMensaje] = useState("");
    let usuario = localStorage.getItem("usuario") ? localStorage.getItem("usuario") : "";

    useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await fetch(`/api/chats?id=${params.id}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cargar el chat');
                }

                const data = await response.json();
                setChat(data);
            } catch (err) {
                console.log(err)
            };
        }
        if (params.id)
            fetchChat();
    }, [params.id]);

    // funcion provisional
    function test() {
        console.log(chat.fechaCreacion)
    }

    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const maxHeight = 98;
            textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight) + 5}px`;
        }
    };

    async function envioMensaje(texto:string) {
        try {
            const respuesta = await fetch(`/api/mensajes?id=${params.id}&usuario=${usuario}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contenido: mensaje
                })
            });
            console.log(respuesta);
            
            const datos = await respuesta.json();
            console.log(datos);
            setMensaje("");
            if (!usuario) localStorage.setItem("usuario", datos.msg.autor.nombreUsuario);
        } catch (error) {
            console.log(error)
        }
    }

    const manejarEnvioMensaje = async (e) => {
        e.preventDefault();
        await envioMensaje(mensaje)
        console.log(mensaje);
        
    }

    return (
        <div className="flex-col w-full flex justify-between min-h-screen">
            <h1>
                Bienvenido a {chat.nombre} creado el {chat.fechaCreacion}, participantes:
                {(chat.participantes || []).length < 1
                    ? 0
                    : <ul>
                        {chat.participantes.map((participante) => <li key={participante.nombreUsuario}>{participante.nombreUsuario}</li>)}
                    </ul>
                }
            </h1>

            <div className='flex items-center w-full flex-col justify-between space-y-5'>
                {(chat.mensajes || []).length < 1
                    ? "Se el primero en enviar un mensaje!"
                    : <ul className='w-90/100 space-y-2'>
                        {chat.mensajes.map((mensaje) =>
                            <li className='border-2 border-gray-200 rounded-md p-1 px-3' key={mensaje.id}>{mensaje.contenido}
                                <span className='float-right'>{mensaje.autor.nombreUsuario}</span>
                            </li>
                        )}
                    </ul>
                }

                <form className="w-90/100 flex justify-center mb-5" onSubmit={manejarEnvioMensaje}>
                    <textarea
                        ref={textareaRef}
                        className="px-3 py-1 border border-gray-200 rounded-md resize-none overflow-y-auto max-h-[50rem] w-full"
                        rows={1}
                        placeholder="Mensaje"
                        value={mensaje}
                        onInput={adjustHeight}
                        onChange={(e) => setMensaje(e.target.value)}
                        />
                    <button className="mx-5" type="submit">Enviar</button>
                </form>
            </div>
        </div>
    )
}

export default ChatPage