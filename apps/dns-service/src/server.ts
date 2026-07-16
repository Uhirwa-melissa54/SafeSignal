import dns2 from 'dns2';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const { Packet } = dns2;
const prisma = new PrismaClient();
const resolver = new dns2({ nameServers: ['1.1.1.1'] });
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:3001';

// Simplified mock blocklist for MVP
const BLOCKED_DOMAINS = [
  { domain: 'xvideos.com', category: 'Adult' },
  { domain: 'pornhub.com', category: 'Adult' },
  { domain: 'bet365.com', category: 'Gambling' },
  { domain: 'casino.com', category: 'Gambling' },
  { domain: 'malware-test.com', category: 'Malware' },
];

const server = dns2.createServer({
  udp: true,
  tcp: true,
});

server.on('request', async (request, send, rinfo) => {
  const response = Packet.createResponseFromRequest(request);
  const [question] = request.questions;

  if (question) {
    const domain = question.name;

    // 1. Identify child from DNS identifier (e.g. child-7f82ac.dns.safesignal.local)
    // For this MVP, we assume the child configures Private DNS as something that we can identify.
    // In a real-world Android Private DNS setup (DoT), we would identify them by the TLS SNI.
    // Here we'll simulate identification by looking for a dnsIdentifier pattern in the domain, 
    // or just simulating it. 
    // Wait, the project requirements said:
    // "Android Private DNS setup... Hostname: dns.safesignal.local."
    // If they all use the same hostname, how do we identify the child? 
    // For a real production app we would use DoT certificates or SNI.
    // For this MVP, let's just assume we can find the child in the DB to test the flow,
    // or we'll just pick the first verified child if we can't identify them from IP/SNI.
    // For demo purposes, we'll try to find any verified child.
    
    let child = await prisma.child.findFirst({
      where: { verified: true, protectionEnabled: true }
    });

    const blockedInfo = BLOCKED_DOMAINS.find(b => domain.includes(b.domain));

    if (blockedInfo && child) {
      console.log(`[DNS] Blocked ${domain} for child ${child.id}`);
      
      // Send webhook to Backend
      try {
        await axios.post(`${BACKEND_URL}/dns/event`, {
          childId: child.id,
          domain: domain,
          category: blockedInfo.category,
        });
      } catch (err: any) {
        console.error(`[DNS] Failed to notify backend: ${err.message}`);
      }

      // Return NXDOMAIN (Domain not found) for blocked sites
      response.header.rcode = 3; 
    } else {
      // Allow domain: resolve using public DNS (1.1.1.1)
      try {
        const result = await resolver.resolveA(domain);
        if (result.answers.length > 0) {
          response.answers.push(result.answers[0]);
        }
      } catch (e) {
        response.header.rcode = 3; // NXDOMAIN if upstream fails
      }
    }
  }

  send(response);
});

const PORT = parseInt(process.env.DNS_PORT || '53', 10);
server.on('listening', () => {
  console.log(`🚀 SafeSignal DNS Server listening on port ${PORT}`);
});

server.on('close', () => {
  console.log('DNS server closed');
});

server.listen({
  udp: { port: PORT },
  tcp: { port: PORT },
});