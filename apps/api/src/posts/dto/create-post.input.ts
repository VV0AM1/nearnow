import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Category } from '@prisma/client';

@InputType()
export class CreatePostInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    title: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    content?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    imageUrl?: string;

    @Field(() => Category, { defaultValue: Category.GENERAL })
    @IsEnum(Category)
    category: Category;

    @Field(() => Float)
    @IsNumber()
    latitude: number;

    @Field(() => Float)
    @IsNumber()
    longitude: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    neighborhoodId?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    neighborhood?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    city?: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    country?: string;
}
