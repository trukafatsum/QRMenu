import { useState, useEffect } from 'react';
import { MenuProvider, useMenu } from './context';
import { GuestMenu } from './components/GuestMenu';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { api } from './api';

const currentPage = () => window.location.hash === '#admin' ? 'admin' : window.location.hash === '#login' ? 'login' : 'menu';
function Pages() {
  const [page, setPage] = useState(currentPage);
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const { loading, loaded, error, reload, dirty } = useMenu();
  useEffect(() => {
    const change = () => setPage(currentPage());
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    if (page === 'menu') { setChecking(false); return; }
    let cancelled = false;
    setChecking(true); setMessage('');
    api<{ authenticated: boolean }>('/api/session').then(async result => {
      if (cancelled) return;
      setAuthenticated(result.authenticated);
      if (result.authenticated && !dirty) await reload(true);
    }).catch(e => { if (!cancelled) { setAuthenticated(false); setMessage(e.message); } })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
    // Check the session on navigation, not on each draft edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, reload]);
  const navigate = (target: string) => { window.location.hash = target; window.scrollTo(0, 0); };
  const logout = async () => {
    if (dirty && !confirm('Yayınlanmamış değişiklikler silinecek. Çıkış yapılsın mı?')) return;
    try {
      if (dirty) await reload(true, true);
      await api('/api/logout', { method: 'POST' });
      setAuthenticated(false); navigate('');
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Çıkış yapılamadı.'); }
  };
  if (loading || (page !== 'menu' && checking)) return <div className="p-12 text-center" role="status">Yükleniyor…</div>;
  if (!loaded) return <div className="p-12 text-center"><p role="alert">{error}</p><button className="mt-4 underline" onClick={() => void reload().catch(() => {})}>Tekrar dene</button></div>;
  return <>
    {message && <p role="alert" className="bg-red-950 p-4 text-center">{message}</p>}
    {page === 'menu' ? <><GuestMenu onGoToDashboard={() => navigate('admin')} />{dirty && <div className="fixed bottom-0 inset-x-0 bg-amber-950 p-3 text-center">Taslak önizleme — henüz yayınlanmadı. <button className="underline" onClick={() => navigate('admin')}>Panele dön</button></div>}</> :
      authenticated ? <Dashboard onLogout={() => void logout()} onViewMenu={() => navigate('')} /> :
        <Login onLogin={async () => { if (!dirty) await reload(true); setAuthenticated(true); navigate('admin'); }} onBack={() => navigate('')} />}
  </>;
}
export default function App() { return <MenuProvider><Pages /></MenuProvider>; }
