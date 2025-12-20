"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io as ClientIO } from "socket.io-client";
import { SOCKET_URL } from "./config";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Attempt connections to localhost
        const socketInstance = ClientIO(SOCKET_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnectionAttempts: 5,
        });

        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            // Join user room for notifications
            const token = document.cookie.split('; ').find(row => row.startsWith('nearnow_user_id='))?.split('=')[1];
            if (token) {
                socketInstance.emit('joinRoom', token);
            }
        });

        socketInstance.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
