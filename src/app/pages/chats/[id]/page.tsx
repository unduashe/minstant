"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRef } from "react";
import io from 'socket.io-client';

function ChatPage() {
    let params = useParams();
    let [chat, setChat] = useState([]);
    let [chatsIdUsuario, setchatsIdUsuario] = useState([])
    let [mensaje, setMensaje] = useState("");
    let usuario = localStorage.getItem("usuario") ? localStorage.getItem("usuario") : "";
    // const socket = useRef(io('http://localhost:3001')).current;
    const socketRef = useRef<any>(null)

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001");
        }
        const socket = socketRef.current;
        console.log(typeof params.id)
        socket.emit('unirseChat', params.id)
    }, [])


    const manejarEnvioMensaje = (e) => {
        e.preventDefault();
        console.log(mensaje);
        if (mensaje.trim()) {
            socketRef.current.emit('mensaje', {
                chatId: params.id,
                usuario: usuario,
                contenido: mensaje
            });
            setMensaje("")
        }
    }

    // useEffect apra obtener la información del chat en el que se encuentra el usuario
    useEffect(() => {
        const buscarChat = async () => {
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
            buscarChat();
    }, [params.id]);

    // useEffect para obtener todos los chats a los que tiene acceso el usuario
    useEffect(() => {
        const obtenerchatsIdUsuario = async () => {
            const resultado = await fetch(`http://localhost:3000/api/chats?usuario=${usuario}`, {
                method: 'GET',
                headers: { "Content-Type": "application/json" },
            })
            if (!resultado.ok) {
                const datosError = await resultado.json();
                console.error("No se han podido obtener los chats", datosError);
                return datosError;
            }
            const datos = await resultado.json();
            setchatsIdUsuario(datos.map((datoChat: any) => datoChat.id))
        }
        if (usuario && usuario !== "undefined" && usuario !== "" || usuario && usuario !== "null" && usuario !== "") obtenerchatsIdUsuario();
    }, [usuario])

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


    useEffect(() => {
        console.log(chatsIdUsuario, "aquiiiiiiiiiiiiiiii");
        chatsIdUsuario.forEach(chatId => {
            socketRef.current.emit('unirseChat', chatId);
        });
    }, [chatsIdUsuario])

    useEffect(() => {
        socketRef.current.on('mensajeServidor', (nuevoMensaje) => {
            console.log("funcionooooooooooooooooooo")
            console.log(nuevoMensaje.msg);
            console.log(chat);
            setChat(prevChat => ({
                ...prevChat,
                mensajes: [...prevChat.mensajes, nuevoMensaje.msg]
            }));
        });
        return () => { socketRef.current.off('mensajeServidor') }
    }, [])

    // useEffect(() => {
    //     socketRef.current.on('mensajeEnviado', (nuevoMensaje) => {
    //         console.log("estoyyyyyyyyyyyyyyyyyyyy")
    //         console.log(nuevoMensaje.msg);
    //         console.log(chat);
    //         setChat(prevChat => ({
    //             ...prevChat,
    //             mensajes: [...prevChat.mensajes, nuevoMensaje.msg]
    //         }));
    //     });
    //     return () => {socketRef.current.off('mensajeEnviado')}
    // }, [])

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