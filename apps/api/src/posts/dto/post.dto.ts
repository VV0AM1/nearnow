import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  Category,
  ConfirmationState,
  LostFoundDirection,
  LostFoundItemType,
} from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
/** Multipart sends booleans as strings; implicit conversion would turn "false" into true. */
export const toBoolean = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0' || value === '')
    return false;
  return value;
};
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const CONTENT_MAX = 2000;

export class CreatePostDto {
  @Transform(trim)
  @IsString()
  @Length(TITLE_MIN, TITLE_MAX, {
    message: `Title must be ${TITLE_MIN}–${TITLE_MAX} characters`,
  })
  title: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(CONTENT_MAX, {
    message: `Description must be at most ${CONTENT_MAX} characters`,
  })
  content?: string;

  @IsEnum(Category, { message: 'Choose a valid category' })
  category: Category;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Latitude must be a number' },
  )
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'Longitude must be a number' },
  )
  @Min(-180)
  @Max(180)
  longitude: number;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  approximateLocation?: boolean;

  // --- Lost & found details (required when category is LOST_FOUND) ---
  @ValidateIf((o: CreatePostDto) => o.category === Category.LOST_FOUND)
  @IsEnum(LostFoundDirection, {
    message: 'Say whether the item was lost or found',
  })
  lostFoundDirection?: LostFoundDirection;

  @ValidateIf((o: CreatePostDto) => o.category === Category.LOST_FOUND)
  @IsEnum(LostFoundItemType, { message: 'Choose an item type' })
  lostFoundItemType?: LostFoundItemType;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString({}, { message: 'occurredFrom must be an ISO date' })
  occurredFrom?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsDateString({}, { message: 'occurredTo must be an ISO date' })
  occurredTo?: string;

  // Accepted for compatibility with older clients; the server derives the area itself.
  @IsOptional()
  @IsString()
  @MaxLength(120)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;
}

export const TIME_WINDOWS = {
  '24h': 24,
  '7d': 24 * 7,
  '30d': 24 * 30,
  all: null,
} as const;
export type TimeWindow = keyof typeof TIME_WINDOWS;

const CATEGORY_VALUES = Object.values(Category) as string[];

export class FeedQueryDto {
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'latitude is required' },
  )
  @Min(-90)
  @Max(90)
  latitude: number;

  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'longitude is required' },
  )
  @Min(-180)
  @Max(180)
  longitude: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0.2)
  @Max(50)
  radius: number = 5;

  /** Comma-separated categories; "ALL" or empty means every category. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value
          .split(',')
          .map((v) => v.trim().toUpperCase())
          .filter((v) => v && v !== 'ALL')
      : value,
  )
  @IsIn(CATEGORY_VALUES, { each: true, message: 'Unknown category' })
  category?: Category[];

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(Object.keys(TIME_WINDOWS))
  since: TimeWindow = 'all';

  /** Include resolved and expired reports (removed ones are never returned). */
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  includeInactive: boolean = false;

  @IsOptional()
  @IsEnum(LostFoundDirection)
  lostFoundDirection?: LostFoundDirection;

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
  @Max(100)
  limit: number = 20;
}

export class AuthorPostsQueryDto {
  @IsUUID()
  authorId: string;

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

export class VoteDto {
  @IsOptional()
  @IsIn(['UP'], { message: 'Only UP votes are supported' })
  type = 'UP' as const;
}

export class ConfirmPostDto {
  @IsEnum(ConfirmationState)
  state: ConfirmationState;
}

export class ResolvePostDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}

export class RemovePostDto {
  @Transform(trim)
  @IsString()
  @Length(3, 280)
  reason: string;
}
