import dns2 from 'dns2';
import axios from 'axios';
import { loadBlocklists, watchBlocklists, checkDomain } from './blocklist';
import { prisma } from './db';

const { Packet } = dns2;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

loadBlocklists();
watchBlocklists();

const server = dns2.createServer({
  udp: true,
  handle: async (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [ question ] = request.questions;
    const { name } = question;
    
    // MVP: In a real world standard port 53 scenario, identifying a mobile client dynamically
    // requires something like DDNS or an app that updates the current IP. 
    // Since we don't have that, we will assign the event to the first verified child.
    const child = await prisma.child.findFirst({
      where: { verified: true, protectionEnabled: true }
    });

    if (child) {
      const category = checkDomain(name);
      
      if (category) {
        console.log(`Blocked ${name} (Category: ${category}) for child ${child.childName}`);
        
        // Return 0.0.0.0 for blocked domains
        response.answers.push({
          name,
          type: Packet.TYPE.A,
          class: Packet.CLASS.IN,
          ttl: 300,
          address: '0.0.0.0'
        });
        
        send(response);
        
        // Log to backend
        try {
          await axios.post(`${BACKEND_URL}/dns/log`, {
            childId: child.id,
            domain: name,
            category
          });
        } catch (err) {
          console.error('Failed to send log to backend:', err);
        }
        return;
      }
    }

    // Forward to Cloudflare 1.1.1.1
    try {
      const result = await dns2.resolveA(name, '1.1.1.1');
      if (result && result.answers) {
        response.answers = result.answers;
      }
    } catch (err) {
      console.error(`Failed to resolve ${name}:`, err);
    }
    
    send(response);
  }
});

server.on('request', (request, response, rinfo) => {
  // console.log(request.header.id, request.questions[0].name);
});

server.on('requestError', (error) => {
  console.log('Client Connection Error', error);
});

server.on('listening', () => {
  console.log('SafeSignal Custom DNS server listening on port 53');
});

server.on('close', () => {
  console.log('Server closed');
});

server.listen({
  udp: { port: 53, address: '0.0.0.0' },
  tcp: { port: 53, address: '0.0.0.0' }
});
