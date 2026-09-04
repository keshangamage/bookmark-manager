import {describe, expect, it} from 'vitest';
import {buildNamePatch, parseScimUser, removeUserstorePrefix} from '@/lib/scim';

describe('removeUserstorePrefix', () => {
  it.each([
    ['DEFAULT/jane', 'jane'],
    ['PRIMARY/jane', 'jane'],
    ['jane', 'jane'],
  ])('turns %j into %j', (input, expected) => {
    expect(removeUserstorePrefix(input)).toBe(expected);
  });
});

describe('parseScimUser', () => {
  // The shape Asgardeo returns from GET /scim2/Me.
  const raw = {
    id: '8a7b-uuid',
    userName: 'DEFAULT/jane',
    name: {givenName: 'Jane', familyName: 'Doe'},
    emails: ['jane@example.com'],
    meta: {lastModified: '2026-09-04T10:00:00.000Z', resourceType: 'User'},
  };

  it('extracts the fields the profile page shows', () => {
    expect(parseScimUser(raw)).toEqual({
      id: '8a7b-uuid',
      userName: 'jane',
      email: 'jane@example.com',
      givenName: 'Jane',
      familyName: 'Doe',
      lastModified: '2026-09-04T10:00:00.000Z',
    });
  });

  // SCIM permits both forms and Asgardeo has returned each.
  it('reads an email given as an object', () => {
    expect(parseScimUser({emails: [{value: 'jane@example.com'}]}).email).toBe('jane@example.com');
  });

  it('prefers the primary email', () => {
    const emails = [{value: 'alt@example.com'}, {value: 'main@example.com', primary: true}];
    expect(parseScimUser({emails}).email).toBe('main@example.com');
  });

  // A fresh self-registered account has no name claims at all.
  it('defaults the editable names to empty strings', () => {
    const parsed = parseScimUser({id: 'x'});
    expect(parsed.givenName).toBe('');
    expect(parsed.familyName).toBe('');
    expect(parsed.email).toBeNull();
  });

  it.each([null, undefined, 'nonsense', 42])('survives %j', (input) => {
    expect(() => parseScimUser(input)).not.toThrow();
  });
});

describe('buildNamePatch', () => {
  it('builds a SCIM PatchOp that only replaces the name', () => {
    expect(buildNamePatch({givenName: 'Jane', familyName: 'Doe'})).toEqual({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
      Operations: [{op: 'replace', value: {name: {givenName: 'Jane', familyName: 'Doe'}}}],
    });
  });
});
