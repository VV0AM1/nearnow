import { Injectable, BadRequestException } from '@nestjs/common';
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

    private isProfane(text: string): boolean {
        const badWords = ['bad', 'badword', 'worst']; // Simple list for validation demo
        const lowerText = text.toLowerCase();
        return badWords.some(word => lowerText.includes(word));
    }

    async create(createPostInput: CreatePostInput, authorId: string, imageUrl?: string) {
        // Automated Content Filtering
        if (this.isProfane(createPostInput.title) || (createPostInput.content && this.isProfane(createPostInput.content))) {
            throw new BadRequestException("Post contains inappropriate language.");
        }

        const { neighborhood: rawHood, city: rawCity, country: rawCountry, ...postData } = createPostInput;
        let neighborhoodId = postData.neighborhoodId;

        // Auto-detect/Update Neighborhood Logic
        if (rawHood && rawCity) {
            // Normalize names to prevent simple duplicates (whitespace)
            // Note: Postgres is case-sensitive. "Santa Eulalia" != "Santa Eulàlia".
            // Ideally we'd use a fuzzy match or slug, but simple trim helps.
            const cityName = rawCity.trim();
            const neighborhoodName = rawHood.trim();
            const countryName = (rawCountry || 'Unknown').trim();

            console.log(`[CreatePost] Processing location: Hood="${neighborhoodName}", City="${cityName}"`);

            // 1. Upsert City
            const city = await this.prisma.city.upsert({
                where: { name: cityName },
                update: {},
                create: {
                    name: cityName,
                    country: countryName,
                    latitude: postData.latitude,
                    longitude: postData.longitude
                }
            });

            // 2. Prepare Scoring Updates based on Category
            let scoreUpdate: any = {
                totalCount: { increment: 1 }
            };

            const cat = postData.category;
            console.log(`[CreatePost] Category: ${cat}`);

            if (['CRIME', 'DANGER'].includes(cat)) {
                scoreUpdate.crimeCount = { increment: 1 };
                console.log("[CreatePost] Incrementing CRIME count");
            } else if (cat === 'SAFETY') {
                scoreUpdate.safetyCount = { increment: 1 };
                console.log("[CreatePost] Incrementing SAFETY count");
            }

            // 3. Upsert Neighborhood
            const neighborhood = await this.prisma.neighborhood.upsert({
                where: {
                    name_cityId: {
                        name: neighborhoodName,
                        cityId: city.id
                    }
                },
                update: scoreUpdate,
                create: {
                    name: neighborhoodName,
                    cityId: city.id,
                    latitude: postData.latitude,
                    longitude: postData.longitude,
                    ...scoreUpdate,
                    crimeCount: scoreUpdate.crimeCount?.increment || 0,
                    safetyCount: scoreUpdate.safetyCount?.increment || 0,
                    totalCount: 1
                }
            });
            console.log(`[CreatePost] Neighborhood Record ID: ${neighborhood.id} (City ID: ${city.id})`);
            neighborhoodId = neighborhood.id;
        }

        // Transaction to create post and update user reputation
        const post = await this.prisma.$transaction(async (tx) => {
            const newPost = await tx.post.create({
                data: {
                    ...postData,
                    neighborhoodId,
                    authorId,
                    imageUrl,
                },
                include: {
                    author: true,
                    neighborhood: true,
                },
            });

            // Award 5 points for creating a post
            await tx.user.update({
                where: { id: authorId },
                data: { reputation: { increment: 5 } }
            });

            return newPost;
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

    async getFeed(lat: number, long: number, radiusKm: number, category?: string, search?: string, page: number = 1, limit: number = 20) {
        // Optimization: Bounding Box to use Index
        const latMin = lat - radiusKm / 111;
        const latMax = lat + radiusKm / 111;
        const longMin = long - radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));
        const longMax = long + radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));

        console.log(`[getFeed] Search: "${search}", Category: "${category}", Radius: ${radiusKm}km`); // DEBUG LOG

        // Parse categories (comma separated)
        const categories = category ? category.split(',') : ['ALL'];
        const hasAll = categories.includes('ALL');
        const offset = (page - 1) * limit;

        // Raw query for distance
        const posts = await this.prisma.$queryRaw<any[]>`
      SELECT id,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
      FROM "Post"
      WHERE latitude BETWEEN ${latMin} AND ${latMax}
      AND longitude BETWEEN ${longMin} AND ${longMax}
      AND ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) < ${radiusKm}
      ${!hasAll && categories.length > 0 ? Prisma.sql`AND category::text IN (${Prisma.join(categories)})` : Prisma.sql``}
      ${search ? Prisma.sql`AND (title ILIKE ${`%${search}%`} OR content ILIKE ${`%${search}%`})` : Prisma.sql``}
      ORDER BY "createdAt" DESC, distance ASC
      LIMIT ${limit} OFFSET ${offset};
    `;

        console.log(`[getFeed] Found ${posts.length} posts`); // DEBUG LOG

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
