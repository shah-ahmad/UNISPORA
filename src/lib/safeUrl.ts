// Database content is untrusted even when it was entered through the admin UI.
export function safeExternalUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || /[\u0000-\u0020\u007f]/.test(value)) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
