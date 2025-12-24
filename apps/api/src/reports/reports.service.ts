import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReportInput } from './dto/create-report.input';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    create(createReportInput: CreateReportInput, reporterId: string) {
        return this.prisma.report.create({
            data: {
                reason: createReportInput.reason,
                post: { connect: { id: createReportInput.postId } },
                reporter: { connect: { id: reporterId } },
            },
        });
    }
}
