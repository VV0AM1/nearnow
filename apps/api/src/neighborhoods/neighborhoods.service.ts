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
                posts: true,
                users: true,
            },
        });
    }
}
