import { Module, forwardRef } from '@nestjs/common';
import { ChildController } from './child.controller';
import { ChildService } from './child.service';
import { SmsModule } from '../sms/sms.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    SmsModule,
    forwardRef(() => WhatsappModule),
  ],
  controllers: [ChildController],
  providers: [ChildService],
  exports: [ChildService],
})
export class ChildModule {}
