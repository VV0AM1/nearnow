import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactRequestDto {
  @Transform(trim)
  @IsString()
  @Length(10, 500, { message: 'Write a short message (10–500 characters)' })
  message: string;

  /** The requester's own lost/found report this request relates to, if any. */
  @IsOptional()
  @IsUUID()
  relatedPostId?: string;
}

export class RespondContactRequestDto {
  @IsIn(['ACCEPT', 'DECLINE', 'BLOCK'])
  action: 'ACCEPT' | 'DECLINE' | 'BLOCK';

  /** Shown only to the requester. Include contact details here only if you want to share them. */
  @Transform(trim)
  @ValidateIf((o: RespondContactRequestDto) => o.action === 'ACCEPT')
  @IsString()
  @Length(2, 500, {
    message: 'Add a reply (2–500 characters) telling them how to continue',
  })
  responseMessage?: string;
}

export class ReportContactRequestDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
