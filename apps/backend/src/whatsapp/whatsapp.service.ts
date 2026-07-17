import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';

/**
 * WhatsAppService handles all Twilio WhatsApp communication:
 * - Parsing inbound commands from parents
 * - Sending outbound messages and alerts
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Twilio.Twilio;
  private readonly from: string;

  constructor(private config: ConfigService) {
    this.client = Twilio(
      this.config.get<string>('TWILIO_ACCOUNT_SID'),
      this.config.get<string>('TWILIO_AUTH_TOKEN'),
    );
    this.from = this.config.get<string>('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886');
  }

  /**
   * Sends a WhatsApp message to a phone number.
   * The 'to' number is automatically prefixed with 'whatsapp:' if not already.
   */
  async sendMessage(to: string, body: string): Promise<void> {
    const recipient = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    try {
      await this.client.messages.create({ body, from: this.from, to: recipient });
      this.logger.log(`WhatsApp sent to ${to}`);
    } catch (err: any) {
      this.logger.error(`WhatsApp send failed to ${to}: ${err.message}`);
    }
  }

  /**
   * Parses an inbound Twilio WhatsApp message body into a structured command.
   * Returns null if the command is unrecognized.
   */
  parseCommand(body: string): { command: string; args: string[] } | null {
    const text = body.trim();
    const upper = text.toUpperCase();

    if (upper === 'REGISTER') {
      return { command: 'REGISTER', args: [] };
    }
    if (upper === 'STATUS') {
      return { command: 'STATUS', args: [] };
    }
    if (upper === 'HELP') {
      return { command: 'HELP', args: [] };
    }
    // ADD CHILD <Name> <Phone>
    const addChildMatch = text.match(/^ADD\s+CHILD\s+(\S+)\s+(\S+)$/i);
    if (addChildMatch) {
      return { command: 'ADD_CHILD', args: [addChildMatch[1], addChildMatch[2]] };
    }

    return null;
  }

  /** Formats the blocked-domain alert sent to a parent */
  formatBlockAlert(childName: string, domain: string, category: string): string {
    const time = new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
    return [
      '⚠️ SafeSignal Alert',
      '',
      `Child: ${childName}`,
      `Blocked website: ${domain}`,
      `Category: ${category}`,
      `Time: ${time}`,
    ].join('\n');
  }

  getHelpMessage(): string {
    return [
      '🛡️ SafeSignal Commands:',
      '',
      'REGISTER – Register as a parent',
      'ADD CHILD [Name] [Phone] – Add a child to protect',
      'STATUS – List your protected children',
      'HELP – Show this menu',
    ].join('\n');
  }

  /**
   * Sends a WhatsApp verification link to a child's phone number.
   * Reuses the existing Twilio client and TWILIO_WHATSAPP_NUMBER sender.
   * Does NOT throw — all errors are caught and logged internally.
   *
   * @param phoneNumber   - Child phone number (e.g. +250781261090 or whatsapp:+250781261090)
   * @param verificationUrl - Full verification URL (e.g. https://app.example.com/verify/<token>)
   */
  async sendVerificationMessage(phoneNumber: string, verificationUrl: string): Promise<void> {
    // Guard: reject empty / nullish inputs before touching the Twilio client
    if (!phoneNumber || !verificationUrl) {
      this.logger.error(
        `sendVerificationMessage called with invalid input — phoneNumber: "${phoneNumber}", verificationUrl: "${verificationUrl}"`,
      );
      return;
    }

    // Normalise destination: avoid double-prefixing
    const to = phoneNumber.startsWith('whatsapp:')
      ? phoneNumber
      : `whatsapp:+${phoneNumber.replace(/^\+/, '')}`;

    const body = [
      '🛡️ SafeSignal',
      'Your parent wants to protect this phone.',
      'Tap the link below to enable protection:',
      verificationUrl,
      'This link expires in 30 minutes.',
    ].join('\n');

    try {
      await this.client.messages.create({ body, from: this.from, to });
      this.logger.log(`WhatsApp sent successfully to ${to}`);
    } catch (err: any) {
      this.logger.error(`WhatsApp failed to ${to}: ${err.message}`);
      // Intentionally not re-throwing — one channel failure must never block the other
    }
  }
}
