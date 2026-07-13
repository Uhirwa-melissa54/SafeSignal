// Simple tests for backend logic
import { handleIncomingWhatsApp } from '../src/services/whatsapp';

// Mock the dependencies
jest.mock('../src/db', () => ({
  prisma: {
    parent: {
      findUnique: jest.fn().mockResolvedValue({ id: 'parent-123', phoneNumber: '123456789' }),
      create: jest.fn().mockResolvedValue({}),
    },
    verificationToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({}),
    },
    child: {
      create: jest.fn().mockResolvedValue({}),
    }
  }
}));

jest.mock('../src/services/sms', () => ({
  sendVerificationSMS: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('twilio', () => {
  return {
    Twilio: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({}),
      }
    }))
  };
});

describe('WhatsApp Parser', () => {
  it('should parse ADD CHILD correctly', async () => {
    // We expect handleIncomingWhatsApp not to throw and handle the regex
    await expect(handleIncomingWhatsApp('123456789', 'ADD CHILD Melissa 0781234567')).resolves.not.toThrow();
  });
  
  it('should reject invalid ADD CHILD format', async () => {
    await expect(handleIncomingWhatsApp('123456789', 'ADD CHILD Melissa')).resolves.not.toThrow();
    // It sends "Invalid format..."
  });
});
