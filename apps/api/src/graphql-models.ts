import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { Role, Category } from '@prisma/client';

// Enums
registerEnumType(Role, { name: 'Role', description: 'User roles' });
registerEnumType(Category, { name: 'Category' });

@ObjectType()
export class User {
    @Field(() => ID)
    id: string;

    @Field()
    email: string;

    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    avatar?: string;

    @Field({ nullable: true })
    bio?: string;

    @Field(() => Role)
    role: Role;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;

    // Relations (Lazy)
    // Use 'any' type to avoid circular dependency ReferenceError during emitDecoratorMetadata
    @Field(() => [Post], { nullable: true })
    posts?: any[];
}

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

    @Field(() => User)
    author: User;

    @Field({ nullable: true })
    neighborhoodId?: string;

    // Use 'any' type to avoid circular dependency ReferenceError
    @Field(() => Neighborhood, { nullable: true })
    neighborhood?: any;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

@ObjectType()
export class Neighborhood {
    @Field()
    id: string;

    @Field()
    name: string;

    @Field()
    city: string;

    @Field(() => Float)
    latitude: number;

    @Field(() => Float)
    longitude: number;

    @Field(() => Float)
    radiusKm: number;

    @Field(() => [Post], { nullable: true })
    posts?: Post[];

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}

@ObjectType()
export class Comment {
    @Field()
    id: string;

    @Field()
    content: string;

    @Field()
    authorId: string;

    @Field(() => User)
    author: User;

    @Field()
    postId: string;

    @Field()
    createdAt: Date;
}

@ObjectType()
export class AuthResponse {
    @Field()
    accessToken: string;

    @Field(() => User)
    user: User;
}
