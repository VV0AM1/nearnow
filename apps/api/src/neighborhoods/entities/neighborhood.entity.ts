import { ObjectType, Field, Float } from '@nestjs/graphql';
// import { Post } from '../../posts/entities/post.entity';
// import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Neighborhood {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    cityId: string;

    @Field(() => Float)
    latitude: number;

    @Field(() => Float)
    longitude: number;

    @Field(() => Float)
    radiusKm: number;

    // @Field(() => [Post], { nullable: true })
    // posts?: Post[];

    // @Field(() => [User], { nullable: true })
    // users?: User[];

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
