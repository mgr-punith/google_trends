// src/lib/socket-server.ts
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer, type ServerOptions } from "socket.io";


type GlobalWithIO = typeof globalThis & {
  __io?: SocketIOServer;
};

// Reusable function to create a new IO instance
function createIO(server: HTTPServer) {
  const ioOptions: Partial<ServerOptions> = {

    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket"],
  };

  const io = new SocketIOServer(server, ioOptions);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    const userId = socket.handshake.query?.userId;
    if (userId) {
      socket.join(String(userId));
      console.log(`Socket ${socket.id} joined user room ${userId}`);
    }

    
    socket.on("join", (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on("leave", (room: string) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
}


export function initSocket(server: HTTPServer) {
  const globalAny = globalThis as GlobalWithIO;

  if (!globalAny.__io) {
    console.log(" Initializing Socket.io server...");
    globalAny.__io = createIO(server);
  }

  return globalAny.__io;
}

/**
 * getIo — Access the global Socket.io instance anywhere
 * (API routes, worker, etc.)
 */
export function getIo(): SocketIOServer {
  const globalAny = globalThis as GlobalWithIO;

  if (!globalAny.__io) {
    throw new Error("Socket.io not initialized. Call initSocket() first.");
  }

  return globalAny.__io;
}
