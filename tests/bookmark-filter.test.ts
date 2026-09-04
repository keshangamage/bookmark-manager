import {describe, expect, it} from 'vitest';
import {escapeLike} from '@/lib/bookmark-filter';

describe('escapeLike', () => {
  // Unescaped, these are LIKE wildcards: searching "50%" would match every row.
  it.each([
    ['50%', '50\\%'],
    ['a_b', 'a\\_b'],
    ['back\\slash', 'back\\\\slash'],
    ['%_\\', '\\%\\_\\\\'],
  ])('escapes %j as %j', (input, expected) => {
    expect(escapeLike(input)).toBe(expected);
  });

  it.each(['plain', 'https://example.com/a-b', '', 'Ünïcode'])('leaves %j alone', (input) => {
    expect(escapeLike(input)).toBe(input);
  });
});
