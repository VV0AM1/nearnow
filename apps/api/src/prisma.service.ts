import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.connectWithRetry();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    private async connectWithRetry(retries = 30, delay = 3000) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.$connect();
                console.log('Successfully connected to database');
                return;
            } catch (error) {
                console.error(`Failed to connect to database (attempt ${i + 1}/${retries}):`, error.message);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}
