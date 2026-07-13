import { Global, Module } from '@nestjs/common';
import { SafeSignalLogger } from './logger.service';

@Global()
@Module({
  providers: [SafeSignalLogger],
  exports: [SafeSignalLogger],
})
export class LoggerModule {}
