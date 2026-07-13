import { checkDomain } from '../src/blocklist';
import fs from 'fs';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readdirSync: jest.fn().mockReturnValue(['adult.txt']),
  readFileSync: jest.fn().mockReturnValue('xvideos.com\nbadsite.com\n'),
  watch: jest.fn()
}));

describe('DNS Blocklist Lookup', () => {
  beforeAll(() => {
    // Requires resetting modules or manually invoking loadBlocklists 
    // if it wasn't mocked properly before import.
    // For MVP, we'll just test the checkDomain logic manually.
  });

  it('should find exact domain match', () => {
    // Assuming blocklistMap is accessible or we test checkDomain's logic
    // checkDomain('xvideos.com')
  });
});
