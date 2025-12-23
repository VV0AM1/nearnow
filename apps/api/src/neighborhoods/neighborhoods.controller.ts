import { Controller, Get, Query } from '@nestjs/common';
import { NeighborhoodsService } from './neighborhoods.service';

@Controller('neighborhoods')
export class NeighborhoodsController {
    constructor(private readonly neighborhoodsService: NeighborhoodsService) { }

    @Get('rankings')
    async getRankings(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius: string,
    ) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius) || 5;

        return this.neighborhoodsService.getRankings(latitude, longitude, radiusKm);
    }

    @Get()
    findAll() {
        return this.neighborhoodsService.findAll();
    }
}
