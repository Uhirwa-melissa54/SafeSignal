import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

/**
 * NotificationService handles DNS blocked-event processing:
 * 1. Stores the event in the database
 * 2. Looks up the child + parent
 * 3. Sends a WhatsApp alert to the parent
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
  ) {}

  async handleBlockedEvent(childId: string, domain: string, category: string): Promise<void> {
    // 1. Persist the block event
    await this.prisma.blockedEvent.create({
      data: { childId, domain, category },
    });

    // 2. Find child and their parent
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { parent: true },
    });

    if (!child) {
      this.logger.warn(`BlockedEvent received for unknown childId: ${childId}`);
      return;
    }

    // 3. Send WhatsApp alert to parent
    const alert = this.whatsapp.formatBlockAlert(child.childName, domain, category);
    await this.whatsapp.sendMessage(child.parent.phoneNumber, alert);
    this.logger.log(`Alert sent to parent ${child.parent.phoneNumber} for domain ${domain}`);
  }
}
