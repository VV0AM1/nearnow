import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, IsOptional } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  password: string;
}

@InputType()
export class SignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
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
