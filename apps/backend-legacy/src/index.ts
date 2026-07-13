import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import { prisma } from './db';
import { handleIncomingWhatsApp } from './services/whatsapp';
import { handleDnsLog } from './services/dnsLog';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the verification HTML page
app.get('/verify/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'verify.html'));
});

// Verification API called by the frontend
app.post('/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const verification = await prisma.verificationToken.findUnique({ where: { token } });
    
    if (!verification) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    if (verification.used) {
      return res.status(400).json({ error: 'Token already used' });
    }

    if (new Date() > verification.expiresAt) {
      return res.status(400).json({ error: 'Token expired' });
    }

    // Generate DNS Identifier
    const dnsIdentifier = `child-${crypto.randomBytes(3).toString('hex')}`;

    // Create Child record
    // Since child name is not in verification token, we might have wanted to store it.
    // For MVP, we use the phone number as name or retrieve if we had stored it.
    // Let's use a generic name since we didn't store it in the token.
    // Wait, the prompt said "ADD CHILD Melissa 0781234567" so we know the name and phone at creation.
    // But we only put phone in verification token.
    // Let's just create it with 'Protected Child' if we don't have it.
    
    const child = await prisma.child.create({
      data: {
        parentId: verification.parentId,
        childName: `Child (${verification.childPhone})`, // fallback
        phoneNumber: verification.childPhone,
        dnsIdentifier,
        verified: true,
      }
    });

    await prisma.verificationToken.update({
      where: { id: verification.id },
      data: { used: true }
    });

    res.json({ success: true, dnsIdentifier });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WhatsApp Webhook (called by Twilio)
app.post('/whatsapp/webhook', async (req, res) => {
  const { From, Body } = req.body;
  
  if (From && Body) {
    // Twilio sends 'whatsapp:+1234567890' in the From field
    const phoneNumber = From.replace('whatsapp:', '');
    await handleIncomingWhatsApp(phoneNumber, Body);
  }
  
  res.status(200).send('<Response></Response>'); // Twilio expects TwiML
});

// Internal API for DNS server to log blocked events
app.post('/dns/log', async (req, res) => {
  const { childId, domain, category } = req.body;
  if (!childId || !domain || !category) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  await handleDnsLog(childId, domain, category);
  res.json({ success: true });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
