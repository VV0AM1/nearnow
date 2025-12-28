"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeighborhoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let NeighborhoodsService = class NeighborhoodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createNeighborhoodInput) {
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
    async getRankings(lat, lng, radiusKm) {
        const allNeighborhoods = await this.prisma.neighborhood.findMany({
            include: { city: true }
        });
        const nearbyById = allNeighborhoods.filter(hood => {
            const dist = this.getDistanceFromLatLonInKm(lat, lng, hood.latitude, hood.longitude);
            return dist <= radiusKm;
        }).map(hood => ({
            ...hood,
            score: Math.max(0, hood.safetyCount - hood.crimeCount)
        }));
        const topDangerous = [...nearbyById]
            .sort((a, b) => b.crimeCount - a.crimeCount)
            .slice(0, 3);
        const topSafe = [...nearbyById]
            .sort((a, b) => b.safetyCount - a.safetyCount)
            .slice(0, 3);
        const generalRanking = [...nearbyById]
            .sort((a, b) => b.score - a.score);
        return {
            topDangerous,
            topSafe,
            ranking: generalRanking
        };
    }
    getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat1)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
};
exports.NeighborhoodsService = NeighborhoodsService;
exports.NeighborhoodsService = NeighborhoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NeighborhoodsService);
//# sourceMappingURL=neighborhoods.service.js.map