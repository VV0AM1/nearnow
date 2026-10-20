import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export class EmailDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254)
  email: string;
}

export class LoginDto extends EmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(PASSWORD_MAX)
  password: string;
}

export class SignupDto extends EmailDto {
  @IsString()
  @MinLength(PASSWORD_MIN, {
    message: `Password must be at least ${PASSWORD_MIN} characters`,
  })
  @MaxLength(PASSWORD_MAX)
  password: string;

  @Transform(trim)
  @IsString()
  @Length(1, 60, { message: 'Name must be 1–60 characters' })
  name: string;
}

export class VerifyOtpDto extends EmailDto {
  @Transform(trim)
  @Matches(/^\d{6}$/, { message: 'The code has 6 digits' })
  otp: string;
}

export class ResetPasswordDto extends VerifyOtpDto {
  @IsString()
  @MinLength(PASSWORD_MIN, {
    message: `Password must be at least ${PASSWORD_MIN} characters`,
  })
  @MaxLength(PASSWORD_MAX)
  newPassword: string;
}

export class ProviderTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;
}
