import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { NeighborhoodsService } from './neighborhoods.service';
import { Neighborhood } from '../graphql-models';
import { CreateNeighborhoodInput } from './dto/create-neighborhood.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';

@Resolver(() => Neighborhood)
export class NeighborhoodsResolver {
    constructor(private readonly neighborhoodsService: NeighborhoodsService) { }

    @Mutation(() => Neighborhood)
    @UseGuards(GqlAuthGuard)
    createNeighborhood(@Args('createNeighborhoodInput') createNeighborhoodInput: CreateNeighborhoodInput) {
        return this.neighborhoodsService.create(createNeighborhoodInput);
    }

    @Query(() => [Neighborhood], { name: 'neighborhoods' })
    findAll() {
        return this.neighborhoodsService.findAll();
    }
}
