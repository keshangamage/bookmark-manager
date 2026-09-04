import {SignJWT} from 'jose';
import {describe, expect, it} from 'vitest';
import {readUserIdFromSessionToken} from '@/lib/session-token';

const SECRET = 'test-secret-value-for-unit-tests';
const key = new TextEncoder().encode(SECRET);

/** Mirrors SessionManager.createSessionToken from @asgardeo/nextjs. */
async function mint(
  claims: Record<string, unknown>,
  {sub = 'user-123', expiresIn = 3600}: {sub?: string; expiresIn?: number} = {},
) {
  return new SignJWT(claims)
    .setProtectedHeader({alg: 'HS256'})
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(key);
}

describe('readUserIdFromSessionToken', () => {
  it('returns the sub from a valid session token', async () => {
    const token = await mint({type: 'session', sessionId: 's1'});
    await expect(readUserIdFromSessionToken(token, SECRET)).resolves.toBe('user-123');
  });

  it('returns null when there is no cookie', async () => {
    await expect(readUserIdFromSessionToken(undefined, SECRET)).resolves.toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const forged = await new SignJWT({type: 'session'})
      .setProtectedHeader({alg: 'HS256'})
      .setSubject('attacker')
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode('a-different-secret'));
    await expect(readUserIdFromSessionToken(forged, SECRET)).resolves.toBeNull();
  });

  it('rejects a tampered signature', async () => {
    const token = await mint({type: 'session'});
    
    const [header, payload, signature] = token.split('.');
    const flipped = `${signature.startsWith('A') ? 'B' : 'A'}${signature.slice(1)}`;
    await expect(readUserIdFromSessionToken(`${header}.${payload}.${flipped}`, SECRET)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const token = await mint({type: 'session'}, {expiresIn: -60});
    await expect(readUserIdFromSessionToken(token, SECRET)).resolves.toBeNull();
  });

  // The SDK issues short-lived `temp` tokens mid-handshake. Accepting one would
  // authenticate a half-finished login.
  it('rejects a temp token', async () => {
    const token = await mint({type: 'temp', sessionId: 's1'});
    await expect(readUserIdFromSessionToken(token, SECRET)).resolves.toBeNull();
  });

  it('rejects a token with no type claim', async () => {
    const token = await mint({sessionId: 's1'});
    await expect(readUserIdFromSessionToken(token, SECRET)).resolves.toBeNull();
  });

  it('rejects malformed input', async () => {
    await expect(readUserIdFromSessionToken('not.a.jwt', SECRET)).resolves.toBeNull();
  });

  it('throws when the signing secret is missing, rather than trusting the token', async () => {
    const token = await mint({type: 'session'});
    await expect(readUserIdFromSessionToken(token, undefined)).rejects.toThrow('ASGARDEO_SECRET');
  });
});
