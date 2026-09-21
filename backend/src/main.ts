import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // class-validator on every DTO, unknown properties rejected — closes
  // docs/ARCHITECTURE.md §15 injection/input-validation control.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS restricted to the deployed frontend origin(s) — see
  // docs/ARCHITECTURE_REVIEW.md K-3, CORS_ALLOWED_ORIGINS in .env.
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const port = process.env.BACKEND_PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`LPG Emergency Delivery API listening on port ${port}`);
}

bootstrap();
