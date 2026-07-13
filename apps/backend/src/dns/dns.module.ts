import { Module } from '@nestjs/common';
import { DnsController } from './dns.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [DnsController],
})
export class DnsModule {}
