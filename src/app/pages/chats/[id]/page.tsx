"use client"
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useRef } from "react";

function ChatPage(){
    let params = useParams();
    let [chat, setChat] = useState([])
    useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await fetch(`/api/chats?id=${params.id}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al cargar el chat');
                }
                
                const data = await response.json();
                console.log(data, "quiiiiiiiii");
                
                setChat(data);
            } catch (err) {
                console.log(err)
        };
    }
    if (params.id)
        fetchChat();
    }, [params.id]);

    function test(){
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

    return(
        <div className="flex-1 w-full relative">
            <h1>
                Bienvenido a {chat.nombre} creado el {chat.fechaCreacion}, participantes:
                {(chat.participantes || []).length < 1 
                ? 0
                : <ul>
                    {chat.participantes.map((participante) => <li key={participante.nombreUsuario}>{participante.nombreUsuario}</li>)}
                </ul>
            }
            </h1>
                
            <button className='w-3xl h-3' onClick={test}>aqui</button>
            <form className="w-full flex justify-center absolute bottom-5/100">
                <textarea 
                ref={textareaRef}
                className="px-3 py-1 border border-gray-200 rounded-md resize-none overflow-y-auto max-h-[50rem] w-85/100" 
                rows={1}
                placeholder="Mensaje" 
                onInput={adjustHeight}/>
                <button className="mx-5" type="submit">Enviar</button>
            </form>
        </div>
    )
}

export default ChatPage