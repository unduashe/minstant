import { useState } from "react";

function Registrarse() {
    let [visibilidadModal, setVisibilidadModal] = useState(false);
    let [formularioRegistrarse, setFormularioRegistrarse] = useState({
        "nombreUsuario": "",
        "contrasena": "",
        "email": ""
    })
    
    function manejoVisibilidadModal() {
        setVisibilidadModal(!visibilidadModal);
    }

    function manejoInputFormulario(e:any){
        const {id, value} = e.target;
        console.log(id,value);
        setFormularioRegistrarse(prev => ({
            ...prev,
            [id]: value
        }))
        
    }

    function manejoSubmit(e: any){
        e.preventDefault()
        console.log(formularioRegistrarse);
        registro()
    }

    async function registro(){
        try {
            const response = await fetch(`http://localhost:3000/api/usuarios`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formularioRegistrarse)
            })
            // if (!response.ok){
            //     const error = await response.json();
            //     console.log(error)
            // }
            const data = await response.json();
            console.log(data);
            return
        } catch (error) {
            console.log(error);
            return
        }
    }

    return (
        <>
            <button className="p-2 bg-green-100 rounded-2xl hover:bg-green-500 hover:text-white hover:cursor-pointer"
                onClick={manejoVisibilidadModal}>
                Registrarse
            </button>
            {visibilidadModal && (
                <div className="flex fixed inset-0 items-center justify-center bg-black/70" onClick={manejoVisibilidadModal}>
                    <form className="flex flex-col p-6 border border-gray-200 rounded-2xl space-y-4 bg-gray-blue w-sm mx-7"
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={manejoSubmit}>
                        <span className="flex flex-col">
                            <label htmlFor="email">Email</label>
                            <input id="email" 
                            type="text" 
                            placeholder="Email" 
                            value={formularioRegistrarse.email} 
                            onChange={manejoInputFormulario}
                            className="p-1 bg-white rounded-md" />
                        </span>
                        <span className="flex flex-col">
                            <label htmlFor="nombreUsuario">Usuario</label>
                            <input id="nombreUsuario" 
                            type="text" 
                            placeholder="Usuario" 
                            value={formularioRegistrarse.nombreUsuario}
                            onChange={manejoInputFormulario} 
                            className="p-1 bg-white rounded-md" />
                        </span>
                        <span className="flex flex-col">
                            <label htmlFor="contrasena">Contraseña</label>
                            <input id="contrasena" 
                            type="password" 
                            placeholder="Contraseña" 
                            value={formularioRegistrarse.contrasena} 
                            onChange={manejoInputFormulario}
                            className="p-1 bg-white rounded-md" />
                        </span>
                        <button type="submit" className="bg-green-500 text-white rounded-2xl mx-auto w-1/2
                        hover:bg-green-700 hover:cursor-pointer">
                            Registrarse
                        </button>
                    </form>
                </div>
            )}
        </>
    )
}

export default Registrarse;