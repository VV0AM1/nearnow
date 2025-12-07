import { ObjectType, Field, Float, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
// import { Neighborhood } from '../../neighborhoods/entities/neighborhood.entity';
import { Category } from '@prisma/client';

registerEnumType(Category, {
    name: 'Category',
});

@ObjectType()
export class Post {
    @Field()
    id: string;

    @Field()
    title: string;

    @Field({ nullable: true })
    content?: string;

    @Field({ nullable: true })
    imageUrl?: string;

    @Field(() => Category)
    category: Category;

    @Field(() => Float)
    latitude: number;

    @Field(() => Float)
    longitude: number;

    @Field()
    authorId: string;

    // @Field(() => User)
    // author: User;

    @Field({ nullable: true })
    neighborhoodId?: string;

    // @Field(() => Neighborhood, { nullable: true })
    // neighborhood?: Neighborhood;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
