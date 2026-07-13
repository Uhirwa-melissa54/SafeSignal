import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

/**
 * ConfigModule loads environment variables from .env and makes ConfigService
 * available globally across all modules.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
})
export class ConfigModule {}
