import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { toBoolean } from '../../posts/dto/post.dto';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(1, 60, { message: 'Name must be 1–60 characters' })
  name?: string;

  @Transform(trim)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(280)
  bio?: string | null;
}

export class SetSavedDto {
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  saved?: boolean;
}

export class DeleteAccountDto {
  @Equals('DELETE', { message: 'Type DELETE to confirm' })
  confirm: string;
}
