import { Module, forwardRef } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ParentModule } from '../parent/parent.module';
import { ChildModule } from '../child/child.module';

@Module({
  imports: [
    forwardRef(() => ParentModule),
    forwardRef(() => ChildModule),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule {}
