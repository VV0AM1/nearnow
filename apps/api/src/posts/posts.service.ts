import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { Category, Prisma } from '@prisma/client';
import { AppGateway } from '../app.gateway';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private gateway: AppGateway
    ) { }

    async create(createPostInput: CreatePostInput, authorId: string) {
        const post = await this.prisma.post.create({
            data: {
                ...createPostInput,
                authorId,
            },
            include: {
                author: true,
                neighborhood: true,
            },
        });

        // Emit event to all clients
        this.gateway.server.emit('postCreated', post);

        return post;
    }

    findAll() {
        return this.prisma.post.findMany({
            include: {
                author: true,
                neighborhood: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getFeed(lat: number, long: number, radiusKm: number, category?: string) {
        // Raw query for distance
        const posts = await this.prisma.$queryRaw<any[]>`
      SELECT id,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
      FROM "Post"
      WHERE ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) < ${radiusKm}
      ${category && category !== 'ALL' ? Prisma.sql`AND category = ${category}::"Category"` : Prisma.sql``}
      ORDER BY distance ASC
      LIMIT 100;
    `;

        const ids = posts.map(p => p.id);
        if (ids.length === 0) return [];

        // Fetch full objects with relations
        const fullPosts = await this.prisma.post.findMany({
            where: { id: { in: ids } },
            include: { author: true, neighborhood: true },
        });

        // Sort implementation to match distance order
        return ids.map(id => fullPosts.find(p => p.id === id)).filter(Boolean);
    }
}
