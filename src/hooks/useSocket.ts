// src/hooks/useSocket.ts
"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (socket) {
      setConnected(true);
      return;
    }
    // connect to default host
    socket = io(undefined, {
      path: "/api/socket",
      transports: ["websocket"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));
    // simple tick to re-render consumers
    socket.on("alert:new", () => setTick((t) => t + 1));

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return socket;
}
