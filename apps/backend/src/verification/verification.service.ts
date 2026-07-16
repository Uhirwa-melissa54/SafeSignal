import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import crypto from 'crypto';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(private prisma: PrismaService) {}

  async validateToken(token: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verification) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verification.used) {
      throw new BadRequestException('Token has already been used');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Token has expired');
    }

    return verification;
  }

  async verifyChild(token: string) {
    // 1. Validate token
    const verification = await this.validateToken(token);

    // 2. Generate unique dnsIdentifier: child-xxxxxx
    let dnsIdentifier = '';
    let isUnique = false;
    while (!isUnique) {
      const suffix = crypto.randomBytes(3).toString('hex');
      dnsIdentifier = `child-${suffix}`;
      const existing = await this.prisma.child.findUnique({
        where: { dnsIdentifier },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // 3. Create Child record and associate with parent
    const child = await this.prisma.child.create({
      data: {
        parentId: verification.parentId,
        childName: verification.childName || `Child (${verification.childPhone})`,
        phoneNumber: verification.childPhone,
        dnsIdentifier,
        verified: true,
        protectionEnabled: true,
      },
    });

    // 4. Mark token as used
    await this.prisma.verificationToken.update({
      where: { id: verification.id },
      data: { used: true },
    });

    this.logger.log(`Verified child ${child.childName} (${child.phoneNumber}) with DNS Identifier ${dnsIdentifier}`);

    return {
      success: true,
      dnsIdentifier,
      childName: child.childName,
    };
  }
}
