import express from 'express'
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", //process.env.NEXTJS_API_URL
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('usuario-conectado', socket.id);
    console.log(socket.id, socket.rooms)
    // evento para unirse a chat
    socket.on('unirseChat', (chatId) => {
        socket.join(chatId);
        console.log(`${socket.id} unido a chat ${chatId}`);
        console.log(`${socket.id} rooms:`, socket.rooms);
    })
    // evento para enviar mensaje y notificación
    socket.on('mensaje', async (datos) => {
        try {
            const { chatId, usuario, contenido } = datos;
            const respuesta = await fetch(`http://localhost:3000/api/mensajes?id=${chatId}&usuario=${usuario}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contenido: contenido
                })
            })
            console.log(respuesta);
            const nuevoMensaje = await respuesta.json();

            io.emit('mensajeEnviado', nuevoMensaje);
            console.log(chatId);
            
            // evento para enviar notificación
            console.log(typeof chatId)
            io.to(chatId).emit('mensajeServidor', nuevoMensaje);
            // io.emit('mensaje-servidor', nuevoMensaje);

        } catch (error) {
            console.log(error)
        }
    })
    // evento para desconexión
    socket.on('disconnect', () => {
        console.log('usuario desconectado', socket.id);

    })
    socket.on('dejarTodasLasSalas', () => {
        const salas = Array.from(socket.rooms);
        salas.forEach(sala => {
            if (sala !== socket.id) { // No abandonar la sala privada del socket
                socket.leave(sala);
            }
        });
    });
})
//   configuración de puerto de escucha de servidor de sockets
const PUERTO = 3001;
httpServer.listen(PUERTO, () => {
    console.log(`Servidor WebScoket escuchando en puerto ${PUERTO}`);
})