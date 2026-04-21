const { Server } = require("socket.io");

let io;

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:5173",
            credentials: true,
        },
    });

    console.log("Socket.io initialized");

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join room for general User Notifications
        socket.on("join_user", (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${socket.id} joined general room: user_${userId}`);
        });

        // Join room based on Order ID for live tracking
        socket.on("join_order", (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`User ${socket.id} joined room: order_${orderId}`);
        });

        // Join room for Restaurant Owners for new orders
        socket.on("join_owner", (restaurantId) => {
            socket.join(`restaurant_${restaurantId}`);
            console.log(`Owner ${socket.id} joined room: restaurant_${restaurantId}`);
        });

        // Join room for Delivery Agent assigned updates
        socket.on("join_delivery", (partnerId) => {
            socket.join(`delivery_${partnerId}`);
            console.log(`Agent ${socket.id} joined room: delivery_${partnerId}`);
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

/**
 * Emit event to a specific room
 * @param {string} room - Room name
 * @param {string} event - Event name
 * @param {object} data - Payload
 */
const emitToRoom = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};

module.exports = {
    initializeSocket,
    getIo,
    emitToRoom,
};
