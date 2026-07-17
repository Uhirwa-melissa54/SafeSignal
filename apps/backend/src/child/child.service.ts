import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import crypto from 'crypto';

@Injectable()
export class ChildService {
  private readonly logger = new Logger(ChildService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
    @Inject(forwardRef(() => WhatsappService))
    private whatsapp: WhatsappService,
  ) {}

  async addChild(parentId: string, childName: string, childPhone: string) {
    // 1. Verify parent exists
    const parent = await this.prisma.parent.findUnique({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // 2. Generate secure token
    const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 character alphanumeric token
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes validation window

    // 3. Store VerificationToken
    await this.prisma.verificationToken.create({
      data: {
        token,
        childPhone,
        childName,
        parentId,
        expiresAt,
      },
    });

    this.logger.log(`Verification token generated for child ${childName} (${childPhone})`);

    // 4. Build the verification URL once — shared by both channels
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;

    // 5. SMS channel — independent try/catch so a failure never blocks WhatsApp
    try {
      await this.sms.sendVerificationSms(childPhone, token);
      this.logger.log(`SMS sent successfully to ${childPhone}`);
    } catch (err: any) {
      this.logger.error(`SMS failed to ${childPhone}: ${err.message}`);
    }

    // 6. WhatsApp channel — independent try/catch so a failure never blocks SMS
    try {
      await this.whatsapp.sendVerificationMessage(childPhone, verificationUrl);
      this.logger.log(`WhatsApp sent successfully to ${childPhone}`);
    } catch (err: any) {
      this.logger.error(`WhatsApp failed to ${childPhone}: ${err.message}`);
    }

    this.logger.log(`Verification process completed for child ${childName} (${childPhone})`);

    return { success: true, token };
  }

  async findVerifiedByDnsIdentifier(dnsIdentifier: string) {
    return this.prisma.child.findFirst({
      where: {
        dnsIdentifier,
        verified: true,
        protectionEnabled: true,
      },
    });
  }

  async getChildrenByParent(parentId: string) {
    return this.prisma.child.findMany({
      where: { parentId },
    });
  }
}
