export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || (response.status === 429 ? 'Çok fazla deneme. Bir dakika sonra tekrar deneyin.' : 'Sunucuya ulaşılamadı. Tekrar deneyin.'));
  if (!data) throw new Error('Sunucu yanıtı geçersiz. Uygulamayı Netlify Dev ile çalıştırın.');
  return data as T;
}
