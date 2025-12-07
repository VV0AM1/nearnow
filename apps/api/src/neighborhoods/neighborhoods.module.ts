import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { NeighborhoodsService } from './neighborhoods.service';
import { NeighborhoodsResolver } from './neighborhoods.resolver';
// Service and Resolver will be added later
@Module({
    imports: [PrismaModule],
    providers: [NeighborhoodsResolver, NeighborhoodsService],
    exports: [NeighborhoodsService],
})
export class NeighborhoodsModule { }
