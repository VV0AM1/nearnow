import { Transform, Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Category } from '@prisma/client';

/** Either a saved area (areaId) or an explicit point + radius (the area the user is viewing). */
export class BriefQueryDto {
  @IsOptional()
  @IsUUID()
  areaId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10)
  radius: number = 2;
}

export class UpdateBriefPreferencesDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(Category, { each: true })
  categories?: Category[];
}

export class CreateSavedAreaDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(10)
  radiusKm: number = 2;
}
