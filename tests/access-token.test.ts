import {createServer, type Server} from 'node:http';
import {type AddressInfo} from 'node:net';
import {SignJWT, exportJWK, generateKeyPair, type KeyObject} from 'jose';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';

const CLIENT_ID = 'test-client-id';
const KID = 'test-key-1';

let server: Server;
let base: string;
let privateKey: KeyObject;
let mod: typeof import('@/lib/access-token');

/**
 * Serves a JWKS from a locally generated key pair, so signature, issuer and
 * audience checks are exercised for real rather than mocked away.
 */
beforeAll(async () => {
  const {publicKey, privateKey: priv} = await generateKeyPair('RS256');
  privateKey = priv as KeyObject;
  const jwk = {...(await exportJWK(publicKey)), kid: KID, alg: 'RS256', use: 'sig'};

  server = createServer((req, res) => {
    if (req.url === '/oauth2/jwks') {
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({keys: [jwk]}));
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL = base;
  process.env.NEXT_PUBLIC_ASGARDEO_CLIENT_ID = CLIENT_ID;
  // Imported after the env is set: the module caches its key set on first use.
  mod = await import('@/lib/access-token');
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

async function mint({
  issuer = `${base}/oauth2/token`,
  audience = CLIENT_ID,
  expiresIn = 3600,
  claims = {},
  key,
}: {
  issuer?: string;
  audience?: string;
  expiresIn?: number;
  claims?: Record<string, unknown>;
  key?: KeyObject;
} = {}) {
  return new SignJWT({...claims})
    .setProtectedHeader({alg: 'RS256', kid: KID})
    .setSubject('user-abc')
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(key ?? privateKey);
}

describe('verifyAccessToken', () => {
  it('accepts a correctly signed token', async () => {
    const claims = await mod.verifyAccessToken(await mint());
    expect(claims.sub).toBe('user-abc');
  });

  it('rejects a token from a different issuer', async () => {
    const token = await mint({issuer: 'https://evil.example.com/oauth2/token'});
    await expect(mod.verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects a token issued for a different client', async () => {
    await expect(mod.verifyAccessToken(await mint({audience: 'some-other-app'}))).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    await expect(mod.verifyAccessToken(await mint({expiresIn: -60}))).rejects.toThrow();
  });

  it('rejects a token signed by a key that is not in the JWKS', async () => {
    const {privateKey: attacker} = await generateKeyPair('RS256');
    const token = await mint({key: attacker as KeyObject});
    await expect(mod.verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects a malformed token', async () => {
    await expect(mod.verifyAccessToken('not.a.jwt')).rejects.toThrow();
  });
});

describe('bearerFrom', () => {
  it.each([
    ['Bearer abc123', 'abc123'],
    ['bearer abc123', 'abc123'],
    ['  Bearer   abc123  ', 'abc123'],
  ])('parses %j', (header, expected) => {
    expect(mod.bearerFrom(header)).toBe(expected);
  });

  it.each([null, '', 'abc123', 'Basic abc123', 'Bearer', 'Bearer   '])(
    'rejects %j',
    (header) => {
      expect(mod.bearerFrom(header)).toBeNull();
    },
  );
});

describe('rolesFrom', () => {
  it.each([
    [{roles: ['admin', 'editor']}, ['admin', 'editor']],
    [{roles: 'admin editor'}, ['admin', 'editor']],
    [{roles: 'admin,editor'}, ['admin', 'editor']],
    [{groups: ['admin']}, ['admin']],
    [{}, []],
    [{roles: 42}, []],
    [{roles: ['admin', 7, null]}, ['admin']],
  ])('normalises %j', (claims, expected) => {
    expect(mod.rolesFrom(claims)).toEqual(expected);
  });

  it('prefers roles over groups when both are present', () => {
    expect(mod.rolesFrom({roles: ['a'], groups: ['b']})).toEqual(['a']);
  });
});

describe('hasRole / hasScope', () => {
  it('matches an assigned role', () => {
    expect(mod.hasRole({roles: ['bookmark-admin']}, 'bookmark-admin')).toBe(true);
    expect(mod.hasRole({roles: ['viewer']}, 'bookmark-admin')).toBe(false);
  });

  it('matches a granted scope', () => {
    expect(mod.hasScope({scope: 'openid profile'}, 'profile')).toBe(true);
    expect(mod.hasScope({scope: 'openid profile'}, 'admin')).toBe(false);
    expect(mod.hasScope({}, 'openid')).toBe(false);
  });
});
