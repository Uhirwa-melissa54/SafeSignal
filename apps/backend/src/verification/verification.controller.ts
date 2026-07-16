import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verify')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  /** GET /verify/:token - validates the token for the frontend page */
  @Get(':token')
  async validateToken(@Param('token') token: string) {
    const verification = await this.verificationService.validateToken(token);
    return {
      valid: true,
      childPhone: verification.childPhone,
      childName: verification.childName,
    };
  }

  /** POST /verify - child presses Continue to enable protection */
  @Post()
  @HttpCode(HttpStatus.OK)
  async verify(@Body('token') token: string) {
    return this.verificationService.verifyChild(token);
  }
}
