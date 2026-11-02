"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { getToken } from "./auth";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

/**
 * Connects with the JWT in the handshake; the server joins the user's private room
 * itself. Without a token only public post events are received.
 */
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const token = getToken();
        const socketInstance = ClientIO(SOCKET_URL, {
            transports: ["websocket", "polling"],
            auth: token ? { token } : {},
            reconnectionAttempts: 5,
        });
        socketInstance.on("connect_error", (err) => console.warn("Socket connection error:", err.message));
        setSocket(socketInstance);
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
