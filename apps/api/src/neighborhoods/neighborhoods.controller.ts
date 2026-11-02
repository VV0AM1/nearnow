import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { NeighborhoodsService } from './neighborhoods.service';

class ActivityQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(25)
  radius: number = 5;

  @Type(() => Number)
  @IsOptional()
  @IsIn([1, 7, 30])
  days: number = 7;
}

@Controller('neighborhoods')
export class NeighborhoodsController {
  constructor(private readonly neighborhoodsService: NeighborhoodsService) {}

  @Get('activity')
  activity(@Query() q: ActivityQueryDto) {
    return this.neighborhoodsService.activity(
      q.latitude,
      q.longitude,
      q.radius,
      q.days,
    );
  }

  @Get('cities')
  cities() {
    return this.neighborhoodsService.listCities();
  }
}
