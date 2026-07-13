import { Body, Controller, Get, Post, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ParentService } from './parent.service';
import { RegisterParentDto } from './dto/register-parent.dto';

/**
 * ParentController handles REST API endpoints for parent registration.
 * The primary parent interaction channel is WhatsApp, but these endpoints
 * are also available for direct API calls.
 */
@Controller()
export class ParentController {
  private readonly logger = new Logger(ParentController.name);

  constructor(private parentService: ParentService) {}

  /** POST /register-parent */
  @Post('register-parent')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterParentDto) {
    const parent = await this.parentService.register(dto.phoneNumber);
    return { success: true, parentId: parent.id };
  }

  /** GET /status?phone=... */
  @Get('status')
  async status(@Query('phone') phone: string) {
    if (!phone) return { error: 'phone query param required' };
    const parent = await this.parentService.findByPhone(phone);
    if (!parent) return { registered: false };
    const children = await this.parentService.getChildren(parent.id);
    return { registered: true, children };
  }
}
