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
    getStats(lat: number, lng: number, radiusKm: number): Promise<{
        id: string;
        name: string;
        city: string;
        score: number;
        alerts: number;
        trend: string;
        latitude: number;
        longitude: number;
    }[]>;
    private getDistanceFromLatLonInKm;
    private deg2rad;
}
