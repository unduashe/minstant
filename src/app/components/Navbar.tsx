"use client"
import Link from "next/link"
import { useEffect, useState } from "react"



function LeftNavbar() {
    let user = localStorage.getItem("user");
    let [userChats, setUserChats] = useState([])

    useEffect(()=> {
        let chats = async () => {
            try {
                let response = await fetch(`/api/chats?user=${user}`, {
                    method: 'GET',
                    headers: { "Content-Type": "application/json" },
                })
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("No se han podido obtener los chats", errorData);
                    return errorData;
                }
                const data = await response.json();
                console.log(data);
                setUserChats(data)
                
                return data;
            } catch (error) {
                console.log(error);
                return;
            }
        }
        chats();
    }, [])
    
    
    return (
        <nav className="w-1/5 p-3">
            <input type="text" className="border-2 border-gray-200 rounded-md p-1 w-1/1 focus:border-black" placeholder="Search chat"></input>
            <h2 className="mt-3 p-2 ps-2 font-semibold text-center">Chats</h2>
            {userChats.length < 1 
            ? "Cargando chats..." //añadir por aqui una animación de los chats cargando
            :<ul>
                {userChats.map((chat) => {
                    return <li key={chat.id} 
                    className="border-b border-gray-200 hover:bg-gray-600 hover:text-white hover:rounded-md"
                    ><Link className="block w-full h-full p-2" href={`/pages/chats/${chat.id}`}>{chat.nombre}</Link></li>
                })}
                {/* <li className="border-b border-gray-200 hover:bg-gray-600 hover:text-white hover:rounded-md">
                    <Link className="block w-full h-full p-2" href={'/Espana'}>España</Link>
                </li>
                <li className="border-b border-gray-200 hover:bg-gray-600 hover:text-white hover:rounded-md">
                    <Link className="block w-full h-full p-2" href={`/Latam`}>LATAM</Link>
                </li> */}
            </ul>
            }
        </nav>
    )
}

export default LeftNavbar;