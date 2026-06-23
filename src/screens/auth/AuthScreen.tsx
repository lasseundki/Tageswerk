import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'login' | 'register' | 'reset';

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') await signIn(email, password);
      else if (mode === 'register') await signUp(email, password);
      else {
        await resetPassword(email);
        setInfo('E-Mail gesendet. Prüfe deinen Posteingang.');
        setMode('login');
      }
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setError('E-Mail oder Passwort falsch.');
      else if (code === 'auth/email-already-in-use')
        setError('Diese E-Mail ist bereits registriert.');
      else if (code === 'auth/weak-password')
        setError('Passwort muss mindestens 6 Zeichen haben.');
      else
        setError('Fehler: ' + code);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="sidebar-logo" style={{ width: 52, height: 52, fontSize: 20, borderRadius: 14 }}>TW</div>
        </div>
        <h1 className="auth-title">Tageswerk</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Passwort zurücksetzen'}
        </p>

        <form onSubmit={handle} className="auth-form">
          <div>
            <label className="input-label">E-Mail</label>
            <input
              className="input" type="email" required autoFocus
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="du@beispiel.de"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="input-label">Passwort</label>
              <input
                className="input" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
              />
            </div>
          )}

          {error && <p className="auth-error">{error}</p>}
          {info && <p className="auth-info">{info}</p>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? '…' : mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => { setMode('register'); setError(''); }}>
                Noch kein Konto? Registrieren
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setMode('reset'); setError(''); }}>
                Passwort vergessen
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setMode('login'); setError(''); }}>
              ← Zurück zur Anmeldung
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
