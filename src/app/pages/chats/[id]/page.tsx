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

function ChatPage() {
    let params = useParams();
    let [chat, setChat] = useState<GuardiaChatEspecifico | null>(null);
    let [chatsIdUsuario, setchatsIdUsuario] = useState<number[]>([]);
    let [mensaje, setMensaje] = useState<string>("");
    let [usuario, setUsuario] = useState<string | null>("");
    const socketRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    // let [textareaHeight, setTextareaHeight] = useState<string>("50px");
    const mensajesFinalRef = useRef<HTMLDivElement | null>(null);
    let [primeraCargaPagina, setPrimeraCargaPagina] = useState<boolean>(true)
    const contenedorSueltoRef = useRef<boolean>(false);
    let paginaMensajesRef = useRef<number>(2);
    let [obteniendoMensajesAntiguos, setObteniendoMensajesAntiguos] = useState(false)
    let [obtenidosTodosMensajes, setObtenidosTodosMensajes] = useState(false);
    let [mostrarBoton, setMostrarBoton] = useState<boolean>(false);


    useEffect(() => {
        const usuarioAlmacenamientoNavegador = localStorage.getItem("usuario");
        setUsuario(usuarioAlmacenamientoNavegador)
    }, [])

    // useEffect apra obtener la información del chat en el que se encuentra el usuario
    useEffect(() => {
        const buscarChat = async () => {
            try {
                const resultado = await fetch(`/api/chats?id=${params.id}`);

                if (!resultado.ok) {
                    const errorData = await resultado.json();
                    throw new Error(errorData.error || 'Error al cargar el chat');
                }

                const data = await resultado.json();
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
            // console.log(datos)
            setchatsIdUsuario(datos.map((datoChat: any) => datoChat.id))
        }
        if (usuario && usuario !== "undefined" && usuario !== "" || usuario && usuario !== "null" && usuario !== "") obtenerChatsUsuario();
    }, [usuario])

    // montar el webSocket
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001");
        }
        const socket = socketRef.current;
        socket.emit('unirseChat', params.id)
    }, [])
    // unirse a los chats a los que pertenezca el usuario
    useEffect(() => {
        // console.log(chatsIdUsuario, "aquiiiiiiiiiiiiiiii");
        chatsIdUsuario.forEach(chatId => {
            socketRef.current.emit('unirseChat', chatId);
        });
    }, [chatsIdUsuario])
    // enviar mensaje a través de webSocket
    useEffect(() => {
        const socket = socketRef.current
        socket.on('mensajeServidor', (nuevoMensaje: { msg: GuardiaMensajeChatEspecifico }) => {
            // console.log(nuevoMensaje.msg);
            // console.log(chat);
            if (!nuevoMensaje.msg) return;
            setChat((prevChat) => ({
                ...prevChat!,
                mensajes: [...prevChat!.mensajes, nuevoMensaje.msg]
            }));
        });
        return () => { socket.off('mensajeServidor') }
    }, [chat])

    // obtener mensaje a través de webSocket
    const manejarEnvioMensaje = async (e: React.FormEvent) => {
        await envioMensaje(e);
        contenedorSueltoRef.current = false;
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

    // función tipo de scroleo
    const scrollAbajo = (smooth: string = 'instantaneo') => {
        // console.log(smooth);
        mensajesFinalRef.current?.scrollIntoView({
            behavior: (smooth === 'suave' ? "smooth" : "auto")
        });
    };
    // useEffect para scrolear instantáneamente abajo en la carga de la página
    useEffect(() => {
        if (primeraCargaPagina && chat?.mensajes.length) {
            scrollAbajo('instantaneo');
            setPrimeraCargaPagina(false);
        }
    }, [chat?.mensajes.length, primeraCargaPagina]);
    // useEffecta para scrolear suavemente abajo si el escroll está abajo del todo
    useEffect(() => {
        if (!primeraCargaPagina && chat?.mensajes.length && !contenedorSueltoRef.current) {
            scrollAbajo('suave');
        }
    }, [chat?.mensajes])
    // funcion para manejar que ocurre según donde se encuentre el scroll
    async function manejarScroll(e: any) {

        const scrollTop = e.target.scrollTop;
        const clientHeight = e.target.clientHeight;
        const scrollHeight = e.target.scrollHeight;

        if (scrollHeight - clientHeight - 200 > scrollTop) {
            contenedorSueltoRef.current = true;
            setMostrarBoton(true);
        }
        else {
            contenedorSueltoRef.current = false;
            setMostrarBoton(false);
        }
        if (scrollTop < 400 && !obteniendoMensajesAntiguos && !obtenidosTodosMensajes) {
            cargarMensajesAntiguos();
            setObteniendoMensajesAntiguos(true);
        };
    }
    // funcion para cargar mensajes antiguos
    async function cargarMensajesAntiguos() {
        const pagina = paginaMensajesRef.current;
        try {
            const resultado = await fetch(`/api/mensajes?id=${params.id}&pagina=${pagina}&usuario=${usuario}&skip=${chat?.mensajes.length}`, {
                method: 'GET',
                headers: { "Content-Type": "application/json" },
            })
            if (!resultado.ok) {
                const datosError = await resultado.json();
                console.error("No se han podido obtener los mensajes", datosError);
                return;
            }
            const datos = await resultado.json()
            const nuevosMensajes = datos.mensajes.reverse();
            console.log(nuevosMensajes);
            console.log(chat?.mensajes);

            setChat((prevChat) => {
                if (!prevChat) return prevChat;
                return {
                    ...prevChat,
                    mensajes: [...nuevosMensajes, ...prevChat.mensajes]
                };
            });
            setObteniendoMensajesAntiguos(false);
            if (datos.paginaActual === datos.paginasTotales) {
                setObtenidosTodosMensajes(true);
                return;
            }
            paginaMensajesRef.current = pagina + 1;
        } catch (error) {
            console.log(error);

        }
    }

    // función para ajustar la altura del area del mensaje
    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const maxHeight = 103;
            let alturaDinamica = Math.min(textarea.scrollHeight, maxHeight) + 5
            textarea.style.height = `${alturaDinamica}px`;
            // setTextareaHeight(`${alturaDinamica + 13}px`)
        }
    };

    if (!chat) {
        return <div>Cargando chat...</div>
    }

    return (
        <div className="flex-col w-full flex justify-between min-h-screen overflow-y-auto" onScroll={manejarScroll}>
            <h1 className='sticky top-0 bg-white w-full'>
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

            <div className='flex items-center w-full flex-col justify-between space-y-5 pt-5'>
                {(chat.mensajes || []).length < 1
                    ? "Se el primero en enviar un mensaje!"
                    : <ul className={`w-90/100 space-y-2`}>
                        {chat.mensajes.map((mensaje: GuardiaMensajeChatEspecifico) =>
                            <li className='border-2 border-gray-200 rounded-md p-1 px-3' key={mensaje.id}>{mensaje.contenido}
                                <span className='float-right'>{mensaje.autor.nombreUsuario}{mensaje.id}</span>
                            </li>
                        )}
                    </ul>
                }
                <div className='flex justify-center bg-white w-90/100 sticky bottom-0'>
                    <form className="w-full flex justify-center mb-5 " onSubmit={manejarEnvioMensaje}>
                        <textarea
                            ref={textareaRef}
                            className="px-3 py-1 border border-gray-200 rounded-md resize-none overflow-y-auto max-h-[50rem] w-full"
                            rows={1}
                            placeholder="Mensaje"
                            value={mensaje}
                            onInput={adjustHeight}
                            onChange={(e) => setMensaje(e.target.value)}
                        />
                        <button className="ml-2 bg-blue-500 text-white text-sm px-4 py-2 flex items-center rounded-[16px] 
                        transition-all duration-200 cursor-pointer active:scale-95 group gap-2"
                            type="submit">
                            <svg className='w-5 transition-transform duration-300 ease-in-out group-hover:translate-x-[1.6em] 
                                group-hover:rotate-45 group-hover:scale-110'
                                viewBox="0 0 24 24">
                                <path fill='none' d='M0 0h24v24H0z'></path>
                                <path
                                    fill="currentColor"
                                    d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 
                                        19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z"
                                ></path>
                            </svg>
                            <span className="transition-all duration-300 ease-in-out group-hover:translate-x-[5em]">
                                Enviar
                            </span>
                        </button>
                    </form>
                </div>
                {/* inicio botón condicional para desclazar el scroll abajo del todo */}
                <button className={`${mostrarBoton ? "visible" : "invisible"} absolute bottom-20 right-8 cursor-pointer w-10 h-10 
                rounded-full bg-black flex items-center justify-center overflow-hidden group`}
                    onClick={() => scrollAbajo('suave')}>
                    <svg
                        className="w-3 fill-white duration-300 ease-in-out group-hover:translate-y-12"
                        viewBox="0 0 384 512"
                    >
                        <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 
                        0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.8L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5
                         32.8 0 45.3l160 160z" />
                    </svg>
                    <svg
                        className="w-3 fill-white absolute top-[-2rem] duration-300 ease-in-out group-hover:top-3"
                        viewBox="0 0 384 512"
                    >
                        <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 
                        0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.8L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 
                        32.8 0 45.3l160 160z" />
                    </svg>
                </button>
                {/* fin botón condicional para desclazar el scroll abajo del todo */}
            </div>
            <div ref={mensajesFinalRef} />
        </div>
    )
}

export default ChatPage