import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;
  // For MVP/Dev, we might just require email to "login" if we don't have passwords yet, 
  // or we can add password field if we implemented it. 
  // Let's assume simple email login for "finding" the user, 
  // but ideally we need password or OTP. 
  // For 'Passwordless' style we rely on OTP, but here let's stick to a placeholder 'password' 
  // or just sign them in if they exist for development speed (User requested Google Sign in mostly).
}

@InputType()
export class SignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  name?: string;
}
