import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: [
            'http://localhost:3000',
            'http://localhost:3001',
            process.env.FRONTEND_URL || 'http://localhost:3000'
        ],
        credentials: true,
        methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'], // Allow polling fallbacks
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('locationUpdate')
    handleLocationUpdate(@MessageBody() data: any): string {
        return 'Location received';
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, userId: string) {
        if (userId) {
            client.join(`user_${userId}`);
            console.log(`Client ${client.id} joined room user_${userId}`);
        }
    }
}
