import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Category } from '@prisma/client';
import { toBoolean } from '../../posts/dto/post.dto';

const nullable = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

export class UpdateNotificationSettingsDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(25)
  radiusKm?: number;

  /** null clears the alert area (no nearby alerts are sent without one). */
  @Transform(nullable)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @Transform(nullable)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  @Transform(nullable)
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(80)
  areaLabel?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Category, { each: true })
  categories?: Category[];

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  paused?: boolean;

  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  quietHoursStart?: number | null;

  @ValidateIf((_, v) => v !== null && v !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1439)
  quietHoursEnd?: number | null;

  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(64)
  timezone?: string | null;
}

export class RegisterDeviceDto {
  @IsString()
  @MaxLength(200)
  @Matches(/^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$/, {
    message: 'Invalid push token',
  })
  token: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}

export class ListNotificationsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
