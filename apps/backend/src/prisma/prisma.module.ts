import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule is marked @Global so PrismaService is available everywhere
 * without needing to import it in each feature module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
