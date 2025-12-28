import { PrismaService } from '../prisma.service';
import { CreateNeighborhoodInput } from './dto/create-neighborhood.input';
export declare class NeighborhoodsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createNeighborhoodInput: CreateNeighborhoodInput): import(".prisma/client").Prisma.Prisma__NeighborhoodClient<{
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
        crimeCount: number;
        safetyCount: number;
        totalCount: number;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getRankings(lat: number, lng: number, radiusKm: number): Promise<{
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
    private getDistanceFromLatLonInKm;
    private deg2rad;
}
