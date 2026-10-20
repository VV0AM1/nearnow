import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/main';
import { EmailService } from '../src/email/email.service';
import { PrismaService } from '../src/prisma.service';
import { RateLimitService } from '../src/common/rate-limit.service';

/** Captures verification codes instead of sending email. */
export class FakeEmail {
  codes = new Map<string, string>();
  async sendOtp(email: string, otp: string) {
    this.codes.set(email, otp);
  }
  async sendWelcome() {}
}

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  email: FakeEmail;
  rateLimit: RateLimitService;
  http: () => ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const email = new FakeEmail();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailService)
    .useValue(email)
    .compile();
  const app = moduleRef.createNestApplication({ bodyParser: false });
  configureApp(app);
  await app.init();
  return {
    app,
    email,
    prisma: app.get(PrismaService),
    rateLimit: app.get(RateLimitService),
    http: () => request(app.getHttpServer()),
  };
}

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  token: string;
  password: string;
}

export async function registerUser(
  ctx: TestContext,
  name = 'Tester',
): Promise<TestUser> {
  const email = `user${Date.now()}${counter++}@example.com`;
  const password = 'correct-horse-battery';
  await ctx
    .http()
    .post('/auth/signup')
    .send({ email, password, name })
    .expect(201);
  const otp = ctx.email.codes.get(email)!;
  const res = await ctx
    .http()
    .post('/auth/otp/verify')
    .send({ email, otp })
    .expect(200);
  return { id: res.body.user.id, email, token: res.body.accessToken, password };
}

export const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

export const BCN = { latitude: 41.3874, longitude: 2.1686 };
