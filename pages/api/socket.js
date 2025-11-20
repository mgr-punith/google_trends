import { Server } from "socket.io";

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io...");
    io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      const userId = socket.handshake.query.userId;
      if (userId) socket.join(userId);
    });
  }
  res.end();
}

export function getIO() {
  return io;
}
