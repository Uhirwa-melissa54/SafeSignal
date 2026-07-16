import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

/**
 * SmsService wraps Africa's Talking to send SMS verification links to children.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private sms: any;

  constructor(private config: ConfigService) {
    const AfricasTalking = require('africastalking');
    const ats = AfricasTalking({
      apiKey: this.config.get<string>('ATS_API_KEY'),
      username: this.config.get<string>('ATS_USERNAME'),
    });
    this.sms = ats.SMS;
  }

  /**
   * Sends the verification SMS to a child's phone number.
   * @param to   - Child phone number (e.g. +27781234567)
   * @param token - Verification token
   */
 async sendVerificationSms(to: string, token: string): Promise<void> {
  const frontendUrl = this.config.get<string>(
    'FRONTEND_URL',
    'http://localhost:3000',
  );

  const verifyLink = `${frontendUrl}/verify/${token}`;

  const message = [
    'SafeSignal',
    '',
    'Your parent wants to protect this phone.',
    'Tap the link below to enable protection:',
    '',
    verifyLink,
    '',
    'This link expires in 30 minutes.',
  ].join('\n');

  try {
    const response = await this.sms.send({
      to: [to],
      message,
    });

    // Log the complete Africa's Talking response
    console.log(
      'Africa\'s Talking Response:\n',
      JSON.stringify(response, null, 2),
    );

    this.logger.log(`Verification SMS sent to ${to}`);
  } catch (err: any) {
    this.logger.error(`Failed to send SMS to ${to}: ${err.message}`);

    if (err.response) {
      console.error(
        'Africa\'s Talking Error Response:\n',
        JSON.stringify(err.response.data, null, 2),
      );
    }

    console.error(err);

    // Don't throw — the parent was already notified via WhatsApp
  }
}
}
