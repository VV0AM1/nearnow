import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePostInput } from './dto/create-post.input';
import { Category, Prisma } from '@prisma/client';
import { AppGateway } from '../app.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
    constructor(
        private prisma: PrismaService,
        private gateway: AppGateway,
        private notificationsService: NotificationsService
    ) { }

    async create(createPostInput: CreatePostInput, authorId: string, imageUrl?: string) {
        const post = await this.prisma.post.create({
            data: {
                ...createPostInput,
                authorId,
                imageUrl,
            },
            include: {
                author: true,
                neighborhood: true,
            },
        });

        // Emit event to all clients
        this.gateway.server.emit('postCreated', post);

        // Notify nearby users
        this.notificationsService.notifyUsers(post);

        return post;
    }

    findAll(authorId?: string) {
        return this.prisma.post.findMany({
            where: authorId ? { authorId } : undefined,
            include: {
                author: true,
                neighborhood: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getFeed(lat: number, long: number, radiusKm: number, category?: string, page: number = 1, limit: number = 20) {
        // Parse categories (comma separated)
        const categories = category ? category.split(',') : ['ALL'];
        const hasAll = categories.includes('ALL');
        const offset = (page - 1) * limit;

        // Raw query for distance
        const posts = await this.prisma.$queryRaw<any[]>`
      SELECT id,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
      FROM "Post"
      WHERE ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) < ${radiusKm}
      ${!hasAll && categories.length > 0 ? Prisma.sql`AND category::text IN (${Prisma.join(categories)})` : Prisma.sql``}
      ORDER BY distance ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

        const ids = posts.map(p => p.id);
        if (ids.length === 0) return [];

        // Fetch full objects with relations
        const fullPosts = await this.prisma.post.findMany({
            where: { id: { in: ids } },
            include: {
                author: true,
                neighborhood: true,
                comments: true
            },
        });

        // Sort implementation to match distance order
        return ids.map(id => fullPosts.find(p => p.id === id)).filter(Boolean);
    }

    findOne(id: string) {
        return this.prisma.post.findUnique({
            where: { id },
            include: {
                author: true,
                neighborhood: true,
                comments: {
                    include: {
                        author: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
    }

    async vote(postId: string, userId: string, type: 'UP' | 'DOWN') {
        const existingVote = await this.prisma.postVote.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingVote) {
            // Toggle Logic: If clicking same type, remove vote (Unlike)
            if (existingVote.type === type) {
                return this.prisma.$transaction(async (tx) => {
                    await tx.postVote.delete({
                        where: { id: existingVote.id }
                    });

                    const post = await tx.post.update({
                        where: { id: postId },
                        data: { likes: { decrement: 1 } },
                        include: { author: true }
                    });

                    // Decrement reputation
                    await tx.user.update({
                        where: { id: post.authorId },
                        data: { reputation: { decrement: 1 } }
                    });

                    return { ...post, voted: false };
                });
            } else {
                // Switching vote type (e.g. Down to Up) - Not implemented for simple Like button yet
                // For MVP, treat as remove old, add new? Or just ignore for now if UI only has 'UP'
                return;
            }
        }

        // Create Vote
        return this.prisma.$transaction(async (tx) => {
            await tx.postVote.create({
                data: {
                    userId,
                    postId,
                    type
                }
            });

            const post = await tx.post.update({
                where: { id: postId },
                data: { likes: { increment: 1 } },
                include: { author: true }
            });

            await tx.user.update({
                where: { id: post.authorId },
                data: { reputation: { increment: 1 } }
            });

            return { ...post, voted: true };
        });
    }

    async checkVoteStatus(postId: string, userId: string) {
        const vote = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        return { hasVoted: !!vote, type: vote?.type };
    }
}
