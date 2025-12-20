import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string | null;

  @Field({ nullable: true })
  avatar?: string | null;

  @Field({ nullable: true })
  bio?: string | null;

  @Field({ nullable: true })
  role?: string;

  // Password should not be exposed here
  password?: string | null;
}
