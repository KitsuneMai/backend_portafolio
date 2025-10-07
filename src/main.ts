import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use('/images', express.static(join(__dirname, '..', 'public/images')));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector))
  );

  app.enableCors({
    origin: 'http://localhost:5173', // tu frontend
    credentials: true, // si usas cookies o auth con sesión
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
