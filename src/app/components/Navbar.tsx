"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { GuardiaChatUsuario } from "../../../lib/guardiasTipo";
import { usePathname } from 'next/navigation';



function LeftNavbar() {
    let [usuario, setUsuario] = useState<string | null>(null);
    let [usuarioChats, setUsuarioChats] = useState<GuardiaChatUsuario[]>([]);
    let nombreRuta = usePathname();

    useEffect(() => {
        let usuarioAlmacenamientoLocal = localStorage.getItem("usuario");
        setUsuario(usuarioAlmacenamientoLocal)
    }, [])

    useEffect(() => {
        let chats = async () => {
            try {
                let respuesta = await fetch(`/api/chats?usuario=${usuario}`, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json" },
                })
                if (!respuesta.ok) {
                    const datosError = await respuesta.json();
                    console.error("No se han podido obtener los chats", datosError);
                    return datosError;
                }
                const datos = await respuesta.json();
                console.log(datos);
                setUsuarioChats(datos)

                return datos;
            } catch (error) {
                console.log(error);
                return;
            }
        }
        chats();
    }, [])


    return (
        <nav className="sticky overflow-y-auto w-1/5 p-3">
            <input type="text" className="p-1 w-1/1 border-2 border-gray-200 rounded-md focus:border-black" placeholder="Search chat"></input>
            <h2 className="p-2 ps-2 mt-3 font-semibold text-center">Chats</h2>
            {usuarioChats.length < 1
                ? "Cargando chats..." //añadir por aqui una animación de los chats cargando
                : <ul className="truncate">
                    {usuarioChats.map((chat) => {
                        return <li key={chat.id || `skeleton-${Math.random()}`}
                            className={`border-b border-gray-300 hover:bg-blue-500 hover:text-white hover:rounded-md 
                                ${`/pages/chats/${chat.id}` === nombreRuta ? "rounded-md bg-dark-gray-blue":""}`}
                        ><Link className="block w-full h-full p-2" href={`/pages/chats/${chat.id}`}>{chat.nombre}</Link></li>
                    })}
                </ul>
            }
        </nav>
    )
}

export default LeftNavbar;