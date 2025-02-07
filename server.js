const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidV4 } = require("uuid");

const app = express();
const server = http.createServer(app);

// ✅ Correct CORS Setup
app.use(cors({
    origin: ["http://localhost:5173", "https://chat-frontend-alpha-three.vercel.app"], // Removed trailing slash
    methods: ["GET", "POST"]
}));

// ✅ Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://chat-frontend-alpha-three.vercel.app"], 
        methods: ["GET", "POST"]
    }
});

const rooms = {}; // Store active rooms

// ✅ API to create a room
app.get("/create-room", (req, res) => {
    const roomId = uuidV4();
    rooms[roomId] = [];
    res.json({ roomId });
});

// ✅ Socket.io Event Handlers
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join-room", ({ room, username }) => {
        if (!rooms[room]) {
            rooms[room] = [];
        }
        rooms[room].push(username);
        socket.join(room);

        io.to(room).emit("user-joined", { username, users: rooms[room] });
    });

    socket.on("send-message", ({ room, username, message }) => {
        io.to(room).emit("receive-message", { username, message });
    });

    socket.on("disconnecting", () => {
        for (const room of socket.rooms) {
            if (rooms[room]) {
                rooms[room] = rooms[room].filter((user) => user !== socket.id);
                io.to(room).emit("user-left", { username: socket.id });
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// ✅ Start the Server
server.listen(3000, () => console.log("Server running on http://localhost:3000"));
