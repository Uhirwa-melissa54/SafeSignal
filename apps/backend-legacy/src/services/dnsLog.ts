import { prisma } from '../db';
import { sendWhatsAppMessage } from './whatsapp';

export async function handleDnsLog(childId: string, domain: string, category: string) {
  // 1. Log to database
  await prisma.blockedEvent.create({
    data: {
      childId,
      domain,
      category,
    }
  });

  // 2. Notify parent
  const child = await prisma.child.findUnique({
    where: { id: childId },
    include: { parent: true }
  });

  if (child && child.parent) {
    const alertMsg = `⚠️ SafeSignal Alert\n\nChild:\n${child.childName}\n\nBlocked website:\n${domain}\n\nCategory:\n${category}\n\nTime:\n${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    await sendWhatsAppMessage(child.parent.phoneNumber, alertMsg);
  }
}
