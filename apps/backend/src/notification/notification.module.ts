import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
