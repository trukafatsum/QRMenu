import { describe, expect, it } from 'vitest';
import { publicMenuUrl } from '../src/urls';
describe('Printed QR menu URL', () => {
  it('normalizes the configured bare Netlify domain to an absolute HTTPS URL', () => {
    expect(publicMenuUrl('demo-menu.example')).toBe('https://demo-menu.example/');
    expect(publicMenuUrl('https://menu.example/menu/#admin')).toBe('https://menu.example/menu/');
  });
  it('rejects unsafe or empty URLs', () => {
    for (const input of ['', 'javascript:alert(1)', 'data:text/plain,hello', 'https://user:password@menu.example', 'not a url']) expect(publicMenuUrl(input)).toBeNull();
  });
});
