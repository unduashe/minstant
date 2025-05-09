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
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('usuario-conectado', socket.id);
    // console.log(socket.id, socket.rooms)
    // evento para unirse a chat
    socket.data.salasUnidas = new Set()
    socket.on('unirseChat', (chatId) => {
        if (socket.data.salasUnidas.has(String(chatId))) return;
        else socket.data.salasUnidas.add(String(chatId))
        socket.join(String(chatId));
        console.log(`${socket.id} unido a chat ${chatId}`);
    })
    // evento para enviar mensaje y notificación
    socket.on('mensaje', async (datos) => {
        try {
            // const { chatId, usuario, contenido } = datos;
            // const respuesta = await fetch(`http://localhost:3000/api/mensajes?id=${chatId}&usuario=${usuario}`, {
            const cookies = socket.handshake.headers.cookie
            const { chatId, contenido } = datos;
            const respuesta = await fetch(`http://localhost:3000/api/mensajes?id=${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies || ''
                },
                body: JSON.stringify({
                    contenido: contenido
                })
            })
            const nuevoMensaje = await respuesta.json();

            // io.emit('mensajeEnviado', nuevoMensaje);
            
            // evento para enviar notificación
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