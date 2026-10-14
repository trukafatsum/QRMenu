import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, ChefHat } from 'lucide-react';
import { api } from '../api';

export function Login({ onLogin, onBack }: { onLogin: () => void | Promise<void>; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setPassword(''); await onLogin();
    } catch (e) { setError(e instanceof Error ? e.message : 'Giriş yapılamadı.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/img/demo-background.svg"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm text-ink-200 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Menüye Dön
        </button>

        <div className="rounded-2xl border border-white/10 bg-ink-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg shadow-primary-600/30">
              <ChefHat className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white">Yönetici Girişi</h1>
            <p className="mt-2 text-sm text-ink-300">
              Menü yönetim paneline giriş yapın
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Kullanıcı adı veya e-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Kullanıcı adı veya e-posta"
                  autoComplete="username"
                  className="w-full rounded-xl border border-white/10 bg-ink-800/60 py-3 pl-11 pr-4 text-sm text-white placeholder-ink-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-200">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-ink-800/60 py-3 pl-11 pr-12 text-sm text-white placeholder-ink-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-error/15 px-4 py-3 text-sm text-error border border-error/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary-600 py-3 font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-700 disabled:opacity-60"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
