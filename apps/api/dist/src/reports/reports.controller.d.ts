import { ReportsService } from './reports.service';
import { CreateReportInput } from './dto/create-report.input';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    create(createReportInput: CreateReportInput, req: any): import(".prisma/client").Prisma.Prisma__ReportClient<{
        id: string;
        reason: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        reporterId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
}
