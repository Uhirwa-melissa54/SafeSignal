import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from './config/config.module';
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './health/health.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SmsModule } from './sms/sms.module';
import { NotificationModule } from './notification/notification.module';
import { DnsModule } from './dns/dns.module';
import { ParentModule } from './parent/parent.module';
import { ChildModule } from './child/child.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [PrismaModule, ConfigModule, LoggerModule, HealthModule, WhatsappModule, SmsModule, NotificationModule, DnsModule, ParentModule, ChildModule, VerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
