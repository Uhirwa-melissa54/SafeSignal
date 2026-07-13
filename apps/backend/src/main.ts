import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  // Enable global validation via class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.log(`🚀 SafeSignal Backend running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
