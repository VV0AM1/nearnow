import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

@InputType()
export class CreateCommentInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    content: string;

    @Field()
    @IsNotEmpty()
    @IsUUID()
    postId: string;
}
