import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateNeighborhoodInput } from './dto/create-neighborhood.input';

@Injectable()
export class NeighborhoodsService {
    constructor(private prisma: PrismaService) { }

    create(createNeighborhoodInput: CreateNeighborhoodInput) {
        return this.prisma.neighborhood.create({
            data: createNeighborhoodInput,
        });
    }

    findAll() {
        return this.prisma.neighborhood.findMany({
            include: {
                city: true
            },
        });
    }

    async getRankings(lat: number, lng: number, radiusKm: number) {
        // 1. Fetch relevant neighborhoods (optimization: fetch all for now)
        const allNeighborhoods = await this.prisma.neighborhood.findMany({
            include: { city: true }
        });

        // 2. Filter by distance
        const nearbyById = allNeighborhoods.filter(hood => {
            const dist = this.getDistanceFromLatLonInKm(lat, lng, hood.latitude, hood.longitude);
            return dist <= radiusKm;
        }).map(hood => ({
            ...hood,
            // Calculate a dynamic score for display if needed, but rely on stored counts
            score: Math.max(0, hood.safetyCount - hood.crimeCount)
        }));

        // 3. Top 3 Dangerous (Highest Crime Count)
        const topDangerous = [...nearbyById]
            .sort((a, b) => b.crimeCount - a.crimeCount)
            .slice(0, 3);

        // 4. Top 3 Safe (Highest Safety Count)
        const topSafe = [...nearbyById]
            .sort((a, b) => {
                const diff = b.safetyCount - a.safetyCount;
                if (diff !== 0) return diff;
                return b.totalCount - a.totalCount; // Tie-breaker: most active
            })
            .slice(0, 3);

        // 5. General Ranking (Highest Score = Safest)
        const generalRanking = [...nearbyById]
            .sort((a, b) => b.score - a.score);

        return {
            topDangerous,
            topSafe,
            ranking: generalRanking
        };
    }

    // Helper: Haversine Formula
    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371; // Radius of the earth in km
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat1)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }
}
