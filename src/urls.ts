export function publicMenuUrl(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const trimmed = value.trim();
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}
