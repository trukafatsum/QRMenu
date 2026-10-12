import { useState } from 'react';
import { api } from '../api';
import { useMenu } from '../context';

export function AccountSettings() {
  const { dirty } = useMenu();
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (dirty) { setError('Önce restoran veya ürün değişikliklerinizi kaydedin.'); return; }
    if (newPassword !== confirmation) { setError('Yeni şifreler eşleşmiyor.'); return; }
    setBusy(true);
    try {
      await api('/api/account', { method: 'POST', body: JSON.stringify({ username, currentPassword, newPassword }) });
      window.location.replace(window.location.pathname + window.location.search + '#login');
      window.location.reload();
    } catch (e) { setError(e instanceof Error ? e.message : 'Hesap güncellenemedi.'); setBusy(false); }
  };
  const inputClass = 'mt-2 w-full rounded-lg border border-white/10 bg-ink-900 px-4 py-2.5 text-white';
  return <section className="mt-8 rounded-2xl border border-white/10 bg-ink-800/60 p-6">
    <h2 className="text-xl font-semibold">Giriş Bilgileri</h2>
    <p className="mt-2 text-sm text-ink-300">Kullanıcı adınızı ve şifrenizi değiştirin. Yeni şifreyi boş bırakırsanız mevcut şifre korunur. Kaydettikten sonra yeni bilgilerle tekrar giriş yapmanız gerekir.</p>
    <form onSubmit={submit} className="mt-5">
      <fieldset disabled={busy} className="space-y-4">
        <label className="block">Yeni kullanıcı adı veya e-posta<input className={inputClass} autoComplete="username" required minLength={3} maxLength={128} value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label className="block">Mevcut şifre<input className={inputClass} type="password" autoComplete="current-password" required maxLength={256} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
        <label className="block">Yeni şifre (en az 12 karakter)<input className={inputClass} type="password" autoComplete="new-password" minLength={12} maxLength={256} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <label className="block">Yeni şifre tekrar<input className={inputClass} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        <button className="rounded-xl bg-primary-600 px-6 py-3 font-semibold" type="submit">{busy ? 'Kaydediliyor…' : 'Giriş Bilgilerini Kaydet'}</button>
      </fieldset>
    </form>
  </section>;
}
