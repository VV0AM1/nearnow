import 'dotenv/config';
import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { appConfig, type AppConfig } from './common/env';
import type { ServerResponse } from 'http';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

/** Shared app setup, also used by the e2e tests so they exercise the real pipeline. */
export function configureApp(app: INestApplication) {
  const config = appConfig();
  const express = app as NestExpressApplication;

  express.set('trust proxy', 1); // behind Render/nginx: use the client IP for rate limits
  express.disable('x-powered-by');
  express.useBodyParser('json', { limit: '100kb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Explicit @Type/@Transform decorators only: implicit conversion turns "false" into true.
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  // CORS restricts which browser origins may call the API; it is not authentication.
  app.enableCors({
    origin: config.corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  express.useStaticAssets(resolve(config.uploadDir), {
    prefix: '/uploads/',
    index: false,
    dotfiles: 'deny',
    setHeaders: (res: ServerResponse) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
  });
  app.enableShutdownHooks();
  return app;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  let config: AppConfig;
  try {
    config = appConfig();
  } catch (e) {
    logger.error((e as Error).message);
    process.exit(1);
  }
  if (!config.isProduction && !process.env.JWT_SECRET)
    logger.warn('JWT_SECRET not set — using an insecure development secret');
  if (!config.emailConfigured)
    logger.warn(
      'Email delivery not configured — verification codes are logged (development only)',
    );
  if (config.isProduction && config.storage.provider === 'local')
    logger.warn(
      'Photos are stored on local disk. Use STORAGE_PROVIDER=s3 unless UPLOAD_DIR is a persistent volume.',
    );

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureApp(app);
  await app.listen(config.port, '0.0.0.0');
  logger.log(`API listening on port ${config.port}`);
}

if (require.main === module) void bootstrap();
