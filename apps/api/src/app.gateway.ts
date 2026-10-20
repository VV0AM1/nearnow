import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma.service';
import { appConfig } from './common/env';

/**
 * Real-time channel. Clients authenticate with their JWT in the handshake
 * (`auth: { token }`); the server places them in their own private room. Clients
 * cannot choose rooms, so nobody can subscribe to another user's notifications.
 * Unauthenticated sockets only receive public post events.
 */
@WebSocketGateway({
  cors: {
    origin: appConfig().corsOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
export class AppGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    const raw: unknown =
      client.handshake.auth?.token ?? client.handshake.headers.authorization;
    const token =
      typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '') : null;
    if (!token) return; // anonymous: public events only

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, isBlocked: true, deletedAt: true },
      });
      if (!user || user.isBlocked || user.deletedAt)
        throw new Error('inactive account');
      await client.join(`user_${user.id}`);
    } catch {
      client.emit('auth_error', { message: 'Session expired' });
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user_${userId}`).emit(event, payload);
  }

  /** Public events (e.g. a new post) carry only data already visible to everyone. */
  emitPublic(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
