import { useState, useEffect } from "react";
import { string } from "zod";

function Registrarse() {
    let [registrarseAbierto, setRegistrarseAbierto] = useState(false);
    const [registrarseMensaje, setRegistrarseMensaje] = useState<{ tipo: string; mensaje: string[] }>({ tipo: "", mensaje: [] })
    let [formularioRegistrarse, setFormularioRegistrarse] = useState({
        "nombreUsuario": "",
        "contrasena": "",
        "email": ""
    })

    function manejoregistrarseAbierto() {
        setRegistrarseAbierto(!registrarseAbierto);
    }

    function manejoInputFormulario(e: any) {
        const { id, value } = e.target;
        console.log(id, value);
        setFormularioRegistrarse(prev => ({
            ...prev,
            [id]: value
        }))

    }

    function manejoSubmit(e: any) {
        e.preventDefault()
        console.log(formularioRegistrarse);
        const data = registro()
    }



    async function registro() {
        try {
            const response = await fetch(`http://localhost:3000/api/usuarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formularioRegistrarse)
            })
            const data = await response.json();
            console.log(data);
            if (data.error) {
                let errores
                if (!data.error.issues) errores = [data.error];
                else {errores = data.error.issues
                    .filter((objetos: any) => objetos.code === "custom")
                    .map((objetos: any) => {
                        const mensajeAValidar = objetos.message.split(" ");
                        for (let i = 0; i < mensajeAValidar.length; i++) {
                            if (mensajeAValidar[i] == "nombreUsuario") mensajeAValidar[i] = "Usuario";
                            if (mensajeAValidar[i] == "contrasena") mensajeAValidar[i] = "Contraseña";
                        }
                        return mensajeAValidar.join(" ");
                    })}
                setRegistrarseMensaje({ tipo: "error", mensaje: errores })
            } else {
                setRegistrarseMensaje({ tipo: "msg", mensaje: ["Usuario creado exitosamente, ya puedes logarte con tu nuevo usuario."] })
            }
            return
        } catch (error) {
            console.log(error);
            return
        }
    }

    useEffect(() => {
        if (registrarseMensaje.tipo === "msg") {
            const temporizador = setTimeout(() => {
                setRegistrarseMensaje({ tipo: "", mensaje: [] });
                setFormularioRegistrarse({
                    "nombreUsuario": "",
                    "contrasena": "",
                    "email": ""
                });
                setRegistrarseAbierto(false);
            }, 5000);
            return () => clearTimeout(temporizador);
        } else {
            const temporizador = setTimeout(() => {
                setRegistrarseMensaje({ tipo: "", mensaje: [] });
            }, 10000);
            return () => clearTimeout(temporizador);
        }
    }, [registrarseMensaje.mensaje])


    const alertaModal = () => {
        const timer = setTimeout(() => { })
    }

    return (
        <>
            <button className="p-2 bg-green-100 rounded-2xl hover:bg-green-500 hover:text-white hover:cursor-pointer"
                onClick={manejoregistrarseAbierto}>
                Registrarse
            </button>
            {registrarseAbierto && (
                <div className="flex fixed inset-0 items-center justify-center bg-black/70" onClick={manejoregistrarseAbierto}>
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
                        {registrarseMensaje.mensaje.length > 0 && (
                            <ul className={`p-1.5 rounded-lg
                            ${registrarseMensaje.tipo == "msg" ? "bg-green-200" : "bg-red-200"}`}>
                                {registrarseMensaje.mensaje.map((mensaje, indice) => (
                                    <li className="flex flex-row" key={indice}>•
                                        <p className="ps-1">{mensaje}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </form>
                </div>
            )}
        </>
    )
}

export default Registrarse;