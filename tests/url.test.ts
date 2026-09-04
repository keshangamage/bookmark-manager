import {describe, expect, it} from 'vitest';
import {domainOf, hueOf, normaliseUrl} from '@/lib/url';

describe('normaliseUrl', () => {
  it('adds https:// to a bare host', () => {
    expect(normaliseUrl('example.com')).toBe('https://example.com/');
  });

  it('keeps an existing scheme', () => {
    expect(normaliseUrl('http://example.com/a')).toBe('http://example.com/a');
  });

  it('trims surrounding whitespace', () => {
    expect(normaliseUrl('  example.com/a  ')).toBe('https://example.com/a');
  });

  it.each(['', '   ', 'not a url', 'http://', 'localhost'])('rejects %j', (input) => {
    expect(normaliseUrl(input)).toBeNull();
  });

  // A javascript: bookmark would execute on click, so it must never survive.
  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd'])(
    'rejects the %j scheme',
    (input) => {
      expect(normaliseUrl(input)).toBeNull();
    },
  );
});

describe('domainOf', () => {
  it('strips www.', () => {
    expect(domainOf('https://www.example.com/a')).toBe('example.com');
  });

  it('keeps other subdomains', () => {
    expect(domainOf('https://docs.example.com')).toBe('docs.example.com');
  });

  it('falls back to the raw input when unparseable', () => {
    expect(domainOf('nonsense')).toBe('nonsense');
  });
});

describe('hueOf', () => {
  it('is stable for the same host', () => {
    expect(hueOf('example.com')).toBe(hueOf('example.com'));
  });

  it('stays within the hue range', () => {
    for (const d of ['a.com', 'github.com', 'arxiv.org', 'figma.com', 'neon.com']) {
      expect(hueOf(d)).toBeGreaterThanOrEqual(0);
      expect(hueOf(d)).toBeLessThan(360);
    }
  });

  it('separates different hosts', () => {
    expect(hueOf('github.com')).not.toBe(hueOf('figma.com'));
  });
});
