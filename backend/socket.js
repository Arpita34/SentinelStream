import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    process.env.FRONTEND_URL,
                    "http://localhost:5173"
                ];

                // Allow server-to-server & Postman
                if (!origin) return callback(null, true);

                // Allow Vercel preview + main domain
                if (allowedOrigins.some(o => origin.startsWith(o))) {
                    return callback(null, true);
                }

                console.warn("❌ Socket CORS blocked:", origin);
                callback(new Error("Not allowed by Socket CORS"));
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("🔌 Socket connected:", socket.id);

        socket.on("disconnect", () => {
            console.log("🔌 Socket disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
