import { Twilio } from 'twilio';
import { prisma } from '../db';
import { sendVerificationSMS } from './sms';
import crypto from 'crypto';

const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const TWILIO_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER!;

export async function sendWhatsAppMessage(to: string, body: string) {
  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_NUMBER,
      to,
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

export async function handleIncomingWhatsApp(from: string, body: string) {
  const text = body.trim().toUpperCase();

  if (text === 'REGISTER') {
    return handleRegister(from);
  } else if (text.startsWith('ADD CHILD')) {
    return handleAddChild(from, body);
  } else if (text === 'STATUS') {
    return handleStatus(from);
  } else if (text === 'HELP') {
    return handleHelp(from);
  } else {
    return sendWhatsAppMessage(from, 'Unknown command. Send HELP for a list of commands.');
  }
}

async function handleRegister(phoneNumber: string) {
  const existing = await prisma.parent.findUnique({ where: { phoneNumber } });
  if (existing) {
    await sendWhatsAppMessage(phoneNumber, 'You are already registered with SafeSignal.');
    return;
  }

  await prisma.parent.create({ data: { phoneNumber } });
  await sendWhatsAppMessage(phoneNumber, 'Welcome to SafeSignal! You have been successfully registered. Send HELP to see what you can do.');
}

async function handleAddChild(parentPhone: string, body: string) {
  const parent = await prisma.parent.findUnique({ where: { phoneNumber: parentPhone } });
  if (!parent) {
    await sendWhatsAppMessage(parentPhone, 'You must REGISTER first before adding a child.');
    return;
  }

  // Format: ADD CHILD Melissa 0781234567
  const parts = body.trim().split(/\s+/);
  if (parts.length < 4) {
    await sendWhatsAppMessage(parentPhone, 'Invalid format. Use: ADD CHILD [Name] [PhoneNumber]');
    return;
  }

  const childName = parts[2];
  const childPhone = parts[3];

  const token = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars e.g. 9GH72JQK
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await prisma.verificationToken.create({
    data: {
      token,
      childPhone,
      parentId: parent.id,
      expiresAt,
    }
  });

  await sendVerificationSMS(childPhone, token);
  await sendWhatsAppMessage(parentPhone, `Verification link sent to ${childName} (${childPhone}). The link expires in 30 minutes.`);
}

async function handleStatus(parentPhone: string) {
  const parent = await prisma.parent.findUnique({
    where: { phoneNumber: parentPhone },
    include: { children: true },
  });

  if (!parent) {
    await sendWhatsAppMessage(parentPhone, 'You are not registered.');
    return;
  }

  if (parent.children.length === 0) {
    await sendWhatsAppMessage(parentPhone, 'You have no protected children registered.');
    return;
  }

  let statusMsg = 'SafeSignal Protected Children:\n\n';
  for (const child of parent.children) {
    statusMsg += `• ${child.childName} (${child.phoneNumber})\n`;
    statusMsg += `  Verified: ${child.verified ? 'Yes' : 'No'}\n`;
    statusMsg += `  Protection: ${child.protectionEnabled ? 'Enabled' : 'Disabled'}\n\n`;
  }

  await sendWhatsAppMessage(parentPhone, statusMsg);
}

async function handleHelp(parentPhone: string) {
  const helpMsg = `SafeSignal Commands:
• REGISTER - Register as a parent
• ADD CHILD [Name] [Phone] - Add a child to protect
• STATUS - See your protected children
• HELP - Show this menu`;
  await sendWhatsAppMessage(parentPhone, helpMsg);
}
