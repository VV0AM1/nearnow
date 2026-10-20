import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const REPORT_REASONS = [
  'SPAM',
  'HARASSMENT',
  'PRIVATE_INFORMATION',
  'UNVERIFIED_ACCUSATION',
  'MISLEADING',
  'HATE_OR_VIOLENCE',
  'OTHER',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export class CreateReportInput {
  @IsUUID()
  postId: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase().replace(/\s+/g, '_')
      : value,
  )
  @IsIn(REPORT_REASONS as unknown as string[], {
    message: 'Choose a reason for the report',
  })
  reason: ReportReason;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}
