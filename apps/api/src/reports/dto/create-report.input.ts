import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReportInput {
    @IsString()
    @IsNotEmpty()
    postId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
