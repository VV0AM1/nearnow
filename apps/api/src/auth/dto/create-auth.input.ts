import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class SignupInput {
  @Field()
  email: string;

  @Field()
  password: string;

  @Field({ nullable: true })
  name?: string;
}

@InputType()
export class GoogleLoginInput {
  @Field()
  token: string;
}

@InputType()
export class FacebookLoginInput {
  @Field()
  token: string;
}

@InputType()
export class VerifyOtpInput {
  @Field()
  email: string;

  @Field()
  otp: string;
}
