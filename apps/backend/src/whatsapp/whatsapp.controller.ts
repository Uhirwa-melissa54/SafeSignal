import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { ParentService } from '../parent/parent.service';
import { ChildService } from '../child/child.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private whatsappService: WhatsappService,
    private parentService: ParentService,
    private childService: ChildService,
  ) {}

  /**
   * Webhook called by Twilio Sandbox when a parent sends a WhatsApp message.
   * Path: POST /whatsapp/webhook
   */
  @Post('webhook')
  async handleWebhook(
    @Body('From') from: string,
    @Body('Body') body: string,
    @Res() res: Response,
  ) {
    if (!from || !body) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing From or Body');
    }

    // Twilio sends phone number format: whatsapp:+1234567890
    const parentPhone = from.replace('whatsapp:', '').trim();
    const parsed = this.whatsappService.parseCommand(body);

    if (!parsed) {
      await this.whatsappService.sendMessage(
        parentPhone,
        'Unknown command. Send HELP for a list of available commands.',
      );
      return res.status(HttpStatus.OK).send('<Response></Response>');
    }

    try {
      switch (parsed.command) {
        case 'REGISTER': {
          try {
            await this.parentService.register(parentPhone);
            await this.whatsappService.sendMessage(
              parentPhone,
              'Welcome to SafeSignal! You have been successfully registered.\n\nSend HELP to see available commands.',
            );
          } catch (err: any) {
            // Already registered or validation error
            await this.whatsappService.sendMessage(
              parentPhone,
              'You are already registered with SafeSignal.',
            );
          }
          break;
        }

        case 'ADD_CHILD': {
          const parent = await this.parentService.findByPhone(parentPhone);
          if (!parent) {
            await this.whatsappService.sendMessage(
              parentPhone,
              'You must REGISTER first before adding a child. Send REGISTER.',
            );
            break;
          }

          const [childName, childPhone] = parsed.args;
          await this.childService.addChild(parent.id, childName, childPhone);
          await this.whatsappService.sendMessage(
            parentPhone,
            `Verification link has been sent to ${childName} (${childPhone}). The link will expire in 30 minutes.`,
          );
          break;
        }

        case 'STATUS': {
          const parent = await this.parentService.findByPhone(parentPhone);
          if (!parent) {
            await this.whatsappService.sendMessage(
              parentPhone,
              'You must REGISTER first before viewing status. Send REGISTER.',
            );
            break;
          }

          const children = await this.childService.getChildrenByParent(parent.id);
          if (children.length === 0) {
            await this.whatsappService.sendMessage(
              parentPhone,
              'You have no protected children registered yet.',
            );
            break;
          }

          let responseText = '🛡️ SafeSignal Protected Children:\n\n';
          children.forEach((child) => {
            responseText += `• Name: ${child.childName}\n`;
            responseText += `  Phone: ${child.phoneNumber}\n`;
            responseText += `  Verified: ${child.verified ? 'Yes' : 'No'}\n`;
            responseText += `  Protection: ${child.protectionEnabled ? 'Enabled' : 'Disabled'}\n\n`;
          });

          await this.whatsappService.sendMessage(parentPhone, responseText.trim());
          break;
        }

        case 'HELP':
        default: {
          await this.whatsappService.sendMessage(
            parentPhone,
            this.whatsappService.getHelpMessage(),
          );
          break;
        }
      }
    } catch (err: any) {
      console.error('WhatsApp webhook handler error:', err);
      await this.whatsappService.sendMessage(
        parentPhone,
        'An error occurred while processing your request. Please try again later.',
      );
    }

    return res.status(HttpStatus.OK).send('<Response></Response>');
  }
}
