import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NeighborhoodsService } from './neighborhoods.service';
import { NeighborhoodsResolver } from './neighborhoods.resolver';
import { NeighborhoodsController } from './neighborhoods.controller';

@Module({
    imports: [PrismaModule],
    controllers: [NeighborhoodsController],
    providers: [NeighborhoodsResolver, NeighborhoodsService],
    exports: [NeighborhoodsService],
})
// Forced reload to register controller
export class NeighborhoodsModule { }
