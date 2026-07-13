import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentService {
  private readonly logger = new Logger(ParentService.name);

  constructor(private prisma: PrismaService) {}

  async register(phoneNumber: string) {
    const existing = await this.prisma.parent.findUnique({ where: { phoneNumber } });
    if (existing) {
      throw new ConflictException('Phone number already registered');
    }
    const parent = await this.prisma.parent.create({ data: { phoneNumber } });
    this.logger.log(`Parent registered: ${phoneNumber}`);
    return parent;
  }

  async findByPhone(phoneNumber: string) {
    return this.prisma.parent.findUnique({ where: { phoneNumber } });
  }

  async getChildren(parentId: string) {
    return this.prisma.child.findMany({ where: { parentId } });
  }
}
