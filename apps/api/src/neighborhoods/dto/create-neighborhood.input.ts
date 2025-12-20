import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

@InputType()
export class CreateNeighborhoodInput {
    @Field()
    @IsNotEmpty()
    @IsString()
    name: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    cityId: string;

    @Field(() => Float)
    @IsNumber()
    latitude: number;

    @Field(() => Float)
    @IsNumber()
    longitude: number;

    @Field(() => Float, { defaultValue: 5.0 })
    @IsNumber()
    radiusKm: number;
}
