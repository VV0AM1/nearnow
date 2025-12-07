import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Comment {
    @Field()
    id: string;

    @Field()
    content: string;

    @Field()
    authorId: string;

    // @Field(() => User)
    // author: User;

    @Field()
    postId: string;

    @Field()
    createdAt: Date;
}
