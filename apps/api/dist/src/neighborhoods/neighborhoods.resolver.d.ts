import { NeighborhoodsService } from './neighborhoods.service';
import { CreateNeighborhoodInput } from './dto/create-neighborhood.input';
export declare class NeighborhoodsResolver {
    private readonly neighborhoodsService;
    constructor(neighborhoodsService: NeighborhoodsService);
    createNeighborhood(createNeighborhoodInput: CreateNeighborhoodInput): import(".prisma/client").Prisma.Prisma__NeighborhoodClient<{
        id: string;
        name: string;
        cityId: string;
        latitude: number;
        longitude: number;
        radiusKm: number;
        safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        city: {
            id: string;
            name: string;
            country: string;
            latitude: number;
            longitude: number;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        cityId: string;
        latitude: number;
        longitude: number;
        radiusKm: number;
        safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
