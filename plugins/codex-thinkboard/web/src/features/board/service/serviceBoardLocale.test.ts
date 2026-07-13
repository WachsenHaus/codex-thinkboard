import { describe, expect, test } from 'vitest';

import { resolveLanguage } from './serviceBoardLocale';

describe('resolveLanguage', () => {
  test('uses a saved language before the browser language', () => {
    expect(resolveLanguage('en', 'ko-KR')).toBe('en');
  });

  test('defaults Korean browsers to Korean', () => {
    expect(resolveLanguage(null, 'ko-KR')).toBe('ko');
  });

  test('defaults other browsers to English', () => {
    expect(resolveLanguage(null, 'fr-FR')).toBe('en');
  });
});
