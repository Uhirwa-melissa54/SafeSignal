import fs from 'fs';
import path from 'path';

// Store blocklists in memory
// Map of domain -> category
let blocklistMap = new Map<string, string>();

const BLOCKLISTS_DIR = process.env.BLOCKLISTS_DIR || path.join(__dirname, '../../blocklists');

export function loadBlocklists() {
  const newMap = new Map<string, string>();
  
  if (!fs.existsSync(BLOCKLISTS_DIR)) {
    console.warn(`Blocklist directory not found at ${BLOCKLISTS_DIR}`);
    return;
  }

  const files = fs.readdirSync(BLOCKLISTS_DIR);
  for (const file of files) {
    if (file.endsWith('.txt')) {
      const category = path.basename(file, '.txt');
      const filePath = path.join(BLOCKLISTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      const domains = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
        
      for (const domain of domains) {
        newMap.set(domain, category);
      }
    }
  }

  blocklistMap = newMap;
  console.log(`Loaded ${blocklistMap.size} domains into blocklist.`);
}

// Watch for changes and reload
export function watchBlocklists() {
  if (fs.existsSync(BLOCKLISTS_DIR)) {
    fs.watch(BLOCKLISTS_DIR, (eventType, filename) => {
      console.log(`Blocklist file ${filename} changed. Reloading...`);
      loadBlocklists();
    });
  }
}

export function checkDomain(domain: string): string | null {
  // Simple check, in production we might need to check parent domains as well (e.g. sub.xvideos.com)
  const parts = domain.split('.');
  
  for (let i = 0; i < parts.length - 1; i++) {
    const parentDomain = parts.slice(i).join('.');
    if (blocklistMap.has(parentDomain)) {
      return blocklistMap.get(parentDomain)!;
    }
  }
  
  return null;
}
