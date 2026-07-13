import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { DnsEventDto } from './dto/dns-event.dto';

/**
 * DnsController receives blocked-domain events from the dns-service
 * and delegates to NotificationService to store and alert the parent.
 */
@Controller('dns')
export class DnsController {
  private readonly logger = new Logger(DnsController.name);

  constructor(private notification: NotificationService) {}

  /** POST /dns/event */
  @Post('event')
  @HttpCode(HttpStatus.OK)
  async handleEvent(@Body() dto: DnsEventDto) {
    this.logger.log(`DNS block event: ${dto.domain} (${dto.category}) for child ${dto.childId}`);
    await this.notification.handleBlockedEvent(dto.childId, dto.domain, dto.category);
    return { success: true };
  }
}
