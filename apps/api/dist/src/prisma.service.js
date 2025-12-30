"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.connectWithRetry();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async connectWithRetry(retries = 30, delay = 3000) {
        for (let i = 0; i < retries; i++) {
            try {
                await this.$connect();
                console.log('Successfully connected to database');
                return;
            }
            catch (error) {
                console.error(`Failed to connect to database (attempt ${i + 1}/${retries}):`, error.message);
                if (i === retries - 1)
                    throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map