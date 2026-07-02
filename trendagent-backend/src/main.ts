import * as dotenv from 'dotenv';

dotenv.config();

import './config/cloudinary.config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  const FE_URL =
    process.env.FRONTEND_URL?.replace(/\/$/, '') || 'http://localhost:4000';
  app.enableCors({
    origin: [FE_URL, 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'ngrok-skip-browser-warning',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const firstError = Object.values(errors[0].constraints!)[0];

        return new BadRequestException({
          message: firstError,
          error: 'Bad Request',
          statusCode: 400,
        });
      },
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
