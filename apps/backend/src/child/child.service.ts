import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import crypto from 'crypto';

@Injectable()
export class ChildService {
  private readonly logger = new Logger(ChildService.name);

  constructor(
    private prisma: PrismaService,
    private sms: SmsService,
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

    this.logger.log(`Generated verification token ${token} for child ${childName} (${childPhone})`);

    // 4. Send SMS to child
    await this.sms.sendVerificationSms(childPhone, token);

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
