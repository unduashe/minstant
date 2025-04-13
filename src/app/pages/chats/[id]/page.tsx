"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRef } from "react";
import io from 'socket.io-client';
import {
    GuardiaChatEspecifico,
    GuardiaMensajeChatEspecifico,
    GuardiaChatUsuario,
    GuardiaChatEspecificoParticipantes
} from '../../../../../lib/guardiasTipo';
import e from 'express';

function ChatPage() {
    let params = useParams();
    let [chat, setChat] = useState<GuardiaChatEspecifico | null>(null);
    let [chatsIdUsuario, setchatsIdUsuario] = useState<number[]>([]);
    let [mensaje, setMensaje] = useState<string>("");
    let [usuario, setUsuario] = useState<string | null>("");
    const socketRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    let [textareaHeight, setTextareaHeight] = useState<string>("50px");
    const mensajesFinalRef = useRef<HTMLDivElement | null>(null);
    let [primeraCargaPagina, setPrimeraCargaPagina] = useState<boolean>(true)
    // let [scrollAbajo, setScrollAbajo] = useState<boolean>(true)
    const contenedorSueltoRef = useRef<boolean>(false);


    useEffect(() => {
        const usuarioAlmacenamientoNavegador = localStorage.getItem("usuario");
        setUsuario(usuarioAlmacenamientoNavegador)
    }, [])

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001");
        }
        const socket = socketRef.current;
        socket.emit('unirseChat', params.id)
    }, [])


    const manejarEnvioMensaje = async (e: React.FormEvent) => {
        await envioMensaje(e);
    }
    const envioMensaje = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mensaje.trim()) {
            socketRef.current.emit('mensaje', {
                chatId: params.id,
                usuario: usuario,
                contenido: mensaje
            });
            setMensaje("");
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
                data.mensajes.reverse();
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
        const obtenerChatsUsuario = async () => {
            const resultado = await fetch(`http://localhost:3000/api/chats?usuario=${usuario}`, {
                method: 'GET',
                headers: { "Content-Type": "application/json" },
            })
            if (!resultado.ok) {
                const datosError = await resultado.json();
                console.error("No se han podido obtener los chats", datosError);
                return;
            }
            const datos: GuardiaChatUsuario[] = await resultado.json();
            console.log(datos)
            setchatsIdUsuario(datos.map((datoChat: any) => datoChat.id))
        }
        if (usuario && usuario !== "undefined" && usuario !== "" || usuario && usuario !== "null" && usuario !== "") obtenerChatsUsuario();
    }, [usuario])

    // funcion provisional
    const scrollAbajo = (smooth: string = 'instantaneo') => {
        console.log(smooth);
        mensajesFinalRef.current?.scrollIntoView({
            behavior: (smooth==='suave' ? "smooth" : "auto")
        });
    };

    useEffect(() => {
        if (primeraCargaPagina && chat?.mensajes.length) {
            scrollAbajo('instantaneo');
            setPrimeraCargaPagina(false);
        }
    }, [chat?.mensajes.length, primeraCargaPagina]);

    useEffect(() => {        
        if (!primeraCargaPagina && chat?.mensajes.length && !contenedorSueltoRef.current) {
            scrollAbajo('suave');
        }
    }, [chat?.mensajes])

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const maxHeight = 103;
            let alturaDinamica = Math.min(textarea.scrollHeight, maxHeight) + 5
            textarea.style.height = `${alturaDinamica}px`;
            setTextareaHeight(`${alturaDinamica + 13}px`)
            console.log(textareaHeight);
        }
    };


    useEffect(() => {
        console.log(chatsIdUsuario, "aquiiiiiiiiiiiiiiii");
        chatsIdUsuario.forEach(chatId => {
            socketRef.current.emit('unirseChat', chatId);
        });
    }, [chatsIdUsuario])

    useEffect(() => {
        const socket = socketRef.current
        socket.on('mensajeServidor', (nuevoMensaje: { msg: GuardiaMensajeChatEspecifico }) => {
            console.log(nuevoMensaje.msg);
            console.log(chat);
            if (!nuevoMensaje.msg) return;
            setChat((prevChat) => ({
                ...prevChat!,
                mensajes: [...prevChat!.mensajes, nuevoMensaje.msg]
            }));
        });
        return () => { socket.off('mensajeServidor') }
    }, [chat])

    function manejarScroll(e:any){
        console.log("funciono");
        const scrollTop = e.target.scrollTop;
        const clientHeight = e.target.clientHeight;
        const scrollHeight = e.target.scrollHeight;
        console.log(e.target.scrollTop, e.target.clientHeight, e.target.scrollHeight);
        // console.log(contenedorMensajesRef.current, "el nuevo!");
        // por donde se debería pedir en el scrollTop: 306, 
        // clientHeight = 1478
        // scrollHeight = 1478
        // 734
        if (scrollHeight - clientHeight - 200 > scrollTop) {
            console.log("el scroll esta suelto");
            contenedorSueltoRef.current = true;  
        }
        else contenedorSueltoRef.current = false
    }

    if (!chat) {
        return <div>Cargando chat...</div>
    }

    return (
        <div className="flex-col w-full flex justify-between min-h-screen overflow-y-auto" onScroll={manejarScroll}>
            <h1 className='fixed top-0 bg-white w-full'>
                Bienvenido a {chat.nombre} creado el {chat.fechaCreacion.toString()}, participantes:
                {(chat.participantes || []).length < 1
                    ? 0
                    : <ul className='flex flex-row space-x-1 truncate'>
                        {chat.participantes.map((participante: GuardiaChatEspecificoParticipantes, index: number) => (
                            <li key={participante.nombreUsuario}>
                                {participante.nombreUsuario}{index === chat.participantes.length - 1 ? "." : ","}
                            </li>
                        ))}
                    </ul>
                }
            </h1>

            <div className='flex items-center w-full flex-col justify-between space-y-5 pt-13'>
                {(chat.mensajes || []).length < 1
                    ? "Se el primero en enviar un mensaje!"
                    : <ul className={`w-90/100 space-y-2 pb-[${textareaHeight}]`}>
                        {chat.mensajes.map((mensaje: GuardiaMensajeChatEspecifico) =>
                            <li className='border-2 border-gray-200 rounded-md p-1 px-3' key={mensaje.id}>{mensaje.contenido}
                                <span className='float-right'>{mensaje.autor.nombreUsuario}</span>
                            </li>
                        )}
                    </ul>
                }
                <div className='flex justify-center bg-white w-90/100 fixed bottom-0'>
                    <form className="w-824/1000 flex justify-center mb-5 " onSubmit={manejarEnvioMensaje}>
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
            <div ref={mensajesFinalRef} />
        </div>
    )
}

export default ChatPage