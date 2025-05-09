"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRef } from "react";
import io from "socket.io-client";
import {
    GuardiaChatEspecifico,
    GuardiaMensajeChatEspecifico,
    GuardiaChatUsuario,
    GuardiaChatEspecificoParticipantes,
} from "../../../../../lib/guardiasTipo";

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
    let [primeraCargaPagina, setPrimeraCargaPagina] = useState<boolean>(true);
    const contenedorSueltoRef = useRef<boolean>(false);
    let paginaMensajesRef = useRef<number>(2);
    let [obteniendoMensajesAntiguos, setObteniendoMensajesAntiguos] =
        useState(false);
    let [obtenidosTodosMensajes, setObtenidosTodosMensajes] = useState(false);
    let [mostrarBoton, setMostrarBoton] = useState<boolean>(false);
    let [alertaContenidoInapropiado, setAlertaContenidoInapropiado] =
        useState<boolean>(false);

    useEffect(() => {
        const usuarioAlmacenamientoNavegador = localStorage.getItem("usuario");
        setUsuario(usuarioAlmacenamientoNavegador);
    }, []);

    // useEffect apra obtener la información del chat en el que se encuentra el usuario
    useEffect(() => {
        const buscarChat = async () => {
            try {
                const resultado = await fetch(`/api/chats?id=${params.id}`);

                if (!resultado.ok) {
                    const errorData = await resultado.json();
                    throw new Error(errorData.error || "Error al cargar el chat");
                }

                const data = await resultado.json();
                data.mensajes.reverse();
                setChat(data);
            } catch (err) {
                console.log(err);
            }
        };
        if (params.id) buscarChat();
    }, [params.id]);

    // useEffect para obtener todos los chats a los que tiene acceso el usuario
    useEffect(() => {
        const obtenerChatsUsuario = async () => {
            const resultado = await fetch(
                `http://localhost:3000/api/chats?usuario=${usuario}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );
            if (!resultado.ok) {
                const datosError = await resultado.json();
                console.error("No se han podido obtener los chats", datosError);
                return;
            }
            const datos: GuardiaChatUsuario[] = await resultado.json();
            // console.log(datos)
            setchatsIdUsuario(datos.map((datoChat: any) => datoChat.id));
        };
        if (
            (usuario && usuario !== "undefined" && usuario !== "") ||
            (usuario && usuario !== "null" && usuario !== "")
        )
            obtenerChatsUsuario();
    }, [usuario]);

    // montar el webSocket
    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io("http://localhost:3001", {
                transports: ['websocket'],
                extraHeaders: {
                    "Access-Control-Allow-Credentials": "true"
                },
                withCredentials: true
            } as any);
        }
        const socket = socketRef.current;
        socket.emit("unirseChat", params.id);
    }, []);
    // unirse a los chats a los que pertenezca el usuario
    useEffect(() => {
        // console.log(chatsIdUsuario, "aquiiiiiiiiiiiiiiii");
        chatsIdUsuario.forEach((chatId) => {
            socketRef.current.emit("unirseChat", chatId);
        });
    }, [chatsIdUsuario]);

    // obtener mensaje a través de webSocket
    useEffect(() => {
        const socket = socketRef.current;
        socket.on(
            "mensajeServidor",
            (
                nuevoMensaje: { msg: GuardiaMensajeChatEspecifico } | { error: string }
            ) => {
                if ("error" in nuevoMensaje) return setAlertaContenidoInapropiado(true);
                if (!nuevoMensaje.msg) return;
                setChat((prevChat) => ({
                    ...prevChat!,
                    mensajes: [...prevChat!.mensajes, nuevoMensaje.msg],
                }));
            }
        );
        return () => {
            socket.off("mensajeServidor");
        };
    }, [chat]);

    // enviar mensaje a través de webSocket
    const manejarEnvioMensaje = async (e: React.FormEvent) => {
        await envioMensaje(e);
        contenedorSueltoRef.current = false;
    };
    const envioMensaje = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mensaje.trim()) {
            socketRef.current.emit("mensaje", {
                chatId: params.id,
                // usuario: usuario,
                contenido: mensaje,
            });
            setMensaje("");
        }
    };

    // función tipo de scroleo
    const scrollAbajo = (smooth: string = "instantaneo") => {
        // console.log(smooth);
        mensajesFinalRef.current?.scrollIntoView({
            behavior: smooth === "suave" ? "smooth" : "auto",
        });
    };
    // useEffect para scrolear instantáneamente abajo en la carga de la página
    useEffect(() => {
        if (primeraCargaPagina && chat?.mensajes.length) {
            console.log(chat.mensajes[0].fechaEnvio);

            scrollAbajo("instantaneo");
            setPrimeraCargaPagina(false);
        }
    }, [chat?.mensajes.length, primeraCargaPagina]);
    // useEffecta para scrolear suavemente abajo si el escroll está abajo del todo
    useEffect(() => {
        if (
            !primeraCargaPagina &&
            chat?.mensajes.length &&
            !contenedorSueltoRef.current
        ) {
            scrollAbajo("suave");
        }
    }, [chat?.mensajes]);
    // funcion para manejar que ocurre según donde se encuentre el scroll
    async function manejarScroll(e: any) {
        const scrollTop = e.target.scrollTop;
        const clientHeight = e.target.clientHeight;
        const scrollHeight = e.target.scrollHeight;

        if (scrollHeight - clientHeight - 200 > scrollTop) {
            contenedorSueltoRef.current = true;
            setMostrarBoton(true);
        } else {
            contenedorSueltoRef.current = false;
            setMostrarBoton(false);
        }
        if (
            scrollTop < 400 &&
            !obteniendoMensajesAntiguos &&
            !obtenidosTodosMensajes
        ) {
            cargarMensajesAntiguos();
            setObteniendoMensajesAntiguos(true);
        }
    }
    // funcion para cargar mensajes antiguos
    async function cargarMensajesAntiguos() {
        const pagina = paginaMensajesRef.current;
        try {
            const resultado = await fetch(
                `/api/mensajes?id=${params.id}&pagina=${pagina}&usuario=${usuario}&skip=${chat?.mensajes.length}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );
            if (!resultado.ok) {
                const datosError = await resultado.json();
                console.error("No se han podido obtener los mensajes", datosError);
                return;
            }
            const datos = await resultado.json();
            const nuevosMensajes = datos.mensajes.reverse();
            console.log(nuevosMensajes);
            console.log(chat?.mensajes);

            setChat((prevChat) => {
                if (!prevChat) return prevChat;
                return {
                    ...prevChat,
                    mensajes: [...nuevosMensajes, ...prevChat.mensajes],
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
            let alturaDinamica = Math.min(textarea.scrollHeight, maxHeight) + 5;
            textarea.style.height = `${alturaDinamica}px`;
            // setTextareaHeight(`${alturaDinamica + 13}px`)
        }
    };

    function horasMinutos(fecha: Date) {
        const fechaDate = new Date(fecha);
        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(fechaDate);
    }

    if (!chat) {
        return <div>Cargando chat...</div>;
    }

    return (
        <div
            className="flex flex-col overflow-y-auto justify-between w-full min-h-screen border-l-1 border-l-blue-200 bg-gray-blue"
            onScroll={manejarScroll}
        >
            <div className="sticky top-0 w-full py-1 bg-dark-gray-blue shadow-lg shadow-gray-300">
                <h1 className="flex flex-col w-90/100 mx-auto">
                    <span className="text-lg uppercase font-bold">{chat.nombre}</span>
                    <span>
                        {(chat.participantes || []).length < 1 ? (
                            "Tú"
                        ) : (
                            <ul className="flex flex-row space-x-1 truncate text-sm text-gray-500">
                                {chat.participantes.map(
                                    (
                                        participante: GuardiaChatEspecificoParticipantes,
                                        index: number
                                    ) => (
                                        <li key={participante.nombreUsuario}>
                                            {participante.nombreUsuario}
                                            {index === chat.participantes.length - 1 ? "." : ","}
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                    </span>
                </h1>
            </div>

            <div className="flex flex-col justify-between items-center space-y-5 w-full pt-5">
                {(chat.mensajes || []).length < 1 ? (
                    "Se el primero en enviar un mensaje!"
                ) : (
                    <ul className={`space-y-2 w-90/100`}>
                        {chat.mensajes.map((mensaje: GuardiaMensajeChatEspecifico) => (
                            <li className=" flex flex-col" key={mensaje.id}>
                                <span
                                    className="w-min px-3 ml-1 text-sm border-t-2 border-l-2 border-r-2 border-gray-300 
                                rounded-t-md bg-white "
                                >
                                    {mensaje.autor.nombreUsuario === "anonimo"
                                        ? mensaje.metadatos?.nombreUsuarioAnonimo
                                        : mensaje.autor.nombreUsuario}
                                </span>
                                <div className="p-1 px-3 pb-0 border-2 border-gray-300 rounded-md bg-white">
                                    <span>{mensaje.contenido}</span>
                                    <span className="float-right mt-2 text-sm text-gray-500">
                                        {horasMinutos(mensaje.fechaEnvio)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {/* Inicio formulario mensaje mensaje */}

                <div
                    className="flex sticky bottom-0 justify-center w-full py-2 mb-0 bg-dark-gray-blue 
                drop-shadow-[0_-4px_6px_rgba(209,213,220,1)]"
                >
                    <form
                        className="flex justify-center w-90/100"
                        onSubmit={manejarEnvioMensaje}
                    >
                        <textarea
                            ref={textareaRef}
                            className="overflow-y-auto w-full px-3 py-1 max-h-[50rem] border border-gray-200 rounded-md   
                            bg-white resize-none"
                            rows={1}
                            placeholder="Mensaje"
                            value={mensaje}
                            onInput={adjustHeight}
                            onChange={(e) => setMensaje(e.target.value)}
                        />
                        <button
                            className="group flex flex-shrink-0 overflow-hidden items-center gap-2 px-4 py-2 ml-2 text-sm
                            rounded-[16px] text-white bg-blue-500 transition-all duration-200 active:scale-95 cursor-pointer"
                            type="submit"
                        >
                            <svg
                                className="w-4 transition-transform duration-300 ease-in-out group-hover:translate-x-[1.6em] 
                                group-hover:rotate-45 group-hover:scale-140"
                                viewBox="0 0 24 24"
                            >
                                <path fill="none" d="M0 0h24v24H0z"></path>
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
                {/* fin formulario mensaje */}
                {/* inicio botón condicional para desclazar el scroll abajo del todo */}
                <button
                    className={`${mostrarBoton ? "visible" : "invisible"} group flex overflow-hidden absolute right-8 bottom-20 
                    w-10 h-10 items-center justify-center rounded-full bg-black cursor-pointer`}
                    onClick={() => scrollAbajo("suave")}
                >
                    <svg
                        className="w-3 fill-white duration-300 ease-in-out group-hover:translate-y-12"
                        viewBox="0 0 384 512"
                    >
                        <path
                            d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 
                        0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.8L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5
                         32.8 0 45.3l160 160z"
                        />
                    </svg>
                    <svg
                        className="absolute top-[-2rem] w-3 fill-white duration-300 ease-in-out group-hover:top-3"
                        viewBox="0 0 384 512"
                    >
                        <path
                            d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 
                        0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32v306.8L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 
                        32.8 0 45.3l160 160z"
                        />
                    </svg>
                </button>
                {/* fin botón condicional para desclazar el scroll abajo del todo */}
            </div>
            {alertaContenidoInapropiado ? (
                <div className="flex fixed inset-0 items-center justify-center z-20 bg-black/70">
                    <div className="flex flex-col justify-center space-y-3 w-3xl p-4 rounded-md bg-red-600 shadow-lg">
                        <p className="text-white text-center text-2xl">
                            Minstant no permite mensajes basados en odio, prejuicio o
                            intolerancia, ni actitudes que fomenten la discriminación, el
                            acoso o la violencia en ninguna de sus formas.
                        </p>
                        <button
                            onClick={() => setAlertaContenidoInapropiado(false)}
                            className="w-fit p-2 mx-auto rounded-md text-white bg-blue-500  cursor-pointer 
                            hover:bg-blue-700 active:scale-90"
                        >
                            Seré respetuoso
                        </button>
                    </div>
                </div>
            ) : (
                ""
            )}
            <div ref={mensajesFinalRef} />
        </div>
    );
}

export default ChatPage;
