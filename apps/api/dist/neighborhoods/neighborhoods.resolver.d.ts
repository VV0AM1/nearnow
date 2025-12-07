import { NeighborhoodsService } from './neighborhoods.service';
import { CreateNeighborhoodInput } from './dto/create-neighborhood.input';
export declare class NeighborhoodsResolver {
    private readonly neighborhoodsService;
    constructor(neighborhoodsService: NeighborhoodsService);
    createNeighborhood(createNeighborhoodInput: CreateNeighborhoodInput): import(".prisma/client").Prisma.Prisma__NeighborhoodClient<{
        id: string;
        name: string;
        city: string;
        latitude: number;
        longitude: number;
        radiusKm: number;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        posts: {
            id: string;
            title: string;
            content: string | null;
            imageUrl: string | null;
            category: import(".prisma/client").$Enums.Category;
            latitude: number;
            longitude: number;
            authorId: string;
            neighborhoodId: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        users: {
            id: string;
            email: string;
            name: string | null;
            avatar: string | null;
            bio: string | null;
            password: string | null;
            role: import(".prisma/client").$Enums.Role;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        name: string;
        city: string;
        latitude: number;
        longitude: number;
        radiusKm: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
