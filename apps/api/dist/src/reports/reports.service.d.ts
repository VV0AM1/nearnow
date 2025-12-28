import { PrismaService } from '../prisma.service';
import { CreateReportInput } from './dto/create-report.input';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createReportInput: CreateReportInput, reporterId: string): import(".prisma/client").Prisma.Prisma__ReportClient<{
        id: string;
        reason: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        reporterId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
