import { NeighborhoodsService } from './neighborhoods.service';
export declare class NeighborhoodsController {
    private readonly neighborhoodsService;
    constructor(neighborhoodsService: NeighborhoodsService);
    getRankings(lat: string, lng: string, radius: string): Promise<{
        topDangerous: {
            score: number;
            city: {
                id: string;
                name: string;
                country: string;
                latitude: number;
                longitude: number;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        topSafe: {
            score: number;
            city: {
                id: string;
                name: string;
                country: string;
                latitude: number;
                longitude: number;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        ranking: {
            score: number;
            city: {
                id: string;
                name: string;
                country: string;
                latitude: number;
                longitude: number;
                createdAt: Date;
                updatedAt: Date;
            };
            id: string;
            name: string;
            cityId: string;
            latitude: number;
            longitude: number;
            radiusKm: number;
            safetyLevel: import(".prisma/client").$Enums.SafetyLevel;
            crimeCount: number;
            safetyCount: number;
            totalCount: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
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
        crimeCount: number;
        safetyCount: number;
        totalCount: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
