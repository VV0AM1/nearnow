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

    async getStats(lat: number, lng: number, radiusKm: number) {
        // 1. Fetch ALL neighborhoods (simple MVP, ideally spatial query)
        const allNeighborhoods = await this.prisma.neighborhood.findMany({
            include: { city: true }
        });

        // 2. Filter neighborhoods within radius of User
        const nearbyNeighborhoods = allNeighborhoods.filter(hood => {
            const dist = this.getDistanceFromLatLonInKm(lat, lng, hood.latitude, hood.longitude);
            return dist <= radiusKm;
        });

        // 3. For each nearby neighborhood, count real posts within its radius
        // We fetch ALL posts for now (Optimization: spatial index later)
        const allPosts = await this.prisma.post.findMany();

        const stats = nearbyNeighborhoods.map(hood => {
            // Count posts strictly within this neighborhood's own radius
            const alertCount = allPosts.filter(post => {
                const dist = this.getDistanceFromLatLonInKm(hood.latitude, hood.longitude, post.latitude, post.longitude);
                return dist <= (hood.radiusKm || 1.0);
            }).length;

            // Calculate Score: Start at 100, deduct 5 per alert. Floor at 0.
            const score = Math.max(0, 100 - (alertCount * 5));

            // Determine Trend (Random for MVP as we don't have historical data yet)
            const trend = Math.random() > 0.5 ? 'up' : 'down';

            return {
                id: hood.id,
                name: hood.name,
                city: hood.city?.name || 'Unknown',
                score,
                alerts: alertCount,
                trend,
                latitude: hood.latitude,
                longitude: hood.longitude
            };
        });

        // Sort by Score Descending (Safest First)
        return stats.sort((a, b) => b.score - a.score);
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
