import { Transform } from 'class-transformer';
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateCommentInput {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 1000, { message: 'Comments must be 1–1000 characters' })
  content: string;

  @IsUUID()
  postId: string;
}
