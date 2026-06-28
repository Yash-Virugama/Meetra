import { Server } from "socket.io";

const messages = {};
const timeOnline = {};

export const connectToSocket = (server) => {

    const allowedOrigins = [
        process.env.CLIENT_URL,
    ];

    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {

        console.log("something connected");

        console.log(`Connected: ${socket.id}`);

        // JOIN ROOM
        socket.on("join-call", (roomId) => {
            // Get users already in room BEFORE joining
            const clients = Array.from(
                io.sockets.adapter.rooms.get(roomId) || []
            );

            // Remove the current socket if it's already in the room (reconnection)
            const filteredClients = clients.filter(id => id !== socket.id);

            socket.join(roomId);
            socket.roomId = roomId;
            timeOnline[socket.id] = new Date();

            console.log(`${socket.id} joined ${roomId}`);

            // Send existing clients list to the newly joined user
            socket.emit(
                "user-joined",
                socket.id,
                filteredClients
            );

            // Notify existing users about the new user
            socket.to(roomId).emit(
                "user-joined",
                socket.id,
                filteredClients
            );

            // Send old chat messages to new user
            messages[roomId]?.forEach((message) => {
                socket.emit(
                    "chat-message",
                    message.data,
                    message.sender,
                    message["socket-id-sender"]
                );
            });
        });

        // WEBRTC SIGNALING
        socket.on("signal", (toId, message) => {

            io.to(toId).emit(
                "signal",
                socket.id,
                message
            );

        });

        // CHAT MESSAGE
        socket.on("chat-message", (roomId, data, sender) => {

            // Create room chat history if needed
            messages[roomId] ??= [];

            // Store message
            messages[roomId].push({
                sender,
                data,
                "socket-id-sender": socket.id
            });

            console.log(
                `[${roomId}] ${sender}: ${data}`
            );

            // Send message to everyone in room
            io.to(roomId).emit(
                "chat-message",
                data,
                sender,
                socket.id
            );

        });

        // DISCONNECT
        socket.on("disconnect", () => {

            const roomId = socket.roomId;

            if (roomId) {

                socket.to(roomId).emit(
                    "user-left",
                    socket.id
                );

                console.log(
                    `${socket.id} left ${roomId}`
                );

                const roomClients = io.sockets.adapter.rooms.get(roomId);
                if (!roomClients || roomClients.size === 0) {
                    delete messages[roomId];
                    console.log(`Room ${roomId} is empty. Deleted chat history.`);
                }
            }

            if (timeOnline[socket.id]) {

                const diffTime =
                    Math.abs(
                        new Date() -
                        timeOnline[socket.id]
                    );

                console.log(
                    `${socket.id} stayed ${Math.floor(diffTime / 1000)} seconds`
                );

                delete timeOnline[socket.id];
            }

            console.log(
                `Disconnected: ${socket.id}`
            );

        });

    });

    return io;
};