import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173', // tu frontend
    credentials: true, // si usas cookies o auth con sesión
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
