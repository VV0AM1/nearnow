import { NeighborhoodsService } from './neighborhoods.service';
export declare class NeighborhoodsController {
    private readonly neighborhoodsService;
    constructor(neighborhoodsService: NeighborhoodsService);
    getStats(lat: string, lng: string, radius: string): Promise<{
        id: string;
        name: string;
        city: string;
        score: number;
        alerts: number;
        trend: string;
        latitude: number;
        longitude: number;
    }[]>;
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
