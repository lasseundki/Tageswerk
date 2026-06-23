import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'login' | 'register' | 'reset';

interface AuthError {
  message: string;
  action?: { label: string; mode: Mode };
}

function parseError(code: string, mode: Mode): AuthError {
  switch (code) {
    case 'auth/user-not-found':
      return {
        message: 'Kein Konto mit dieser E-Mail-Adresse.',
        action: { label: 'Jetzt registrieren', mode: 'register' },
      };
    case 'auth/wrong-password':
      return {
        message: 'Falsches Passwort.',
        action: { label: 'Passwort vergessen?', mode: 'reset' },
      };
    case 'auth/invalid-credential':
      // Firebase returns this for both wrong password and non-existent user
      return mode === 'login'
        ? {
            message: 'E-Mail oder Passwort falsch.',
            action: { label: 'Noch kein Konto? Registrieren', mode: 'register' },
          }
        : { message: 'Ungültige Anmeldedaten.' };
    case 'auth/email-already-in-use':
      return {
        message: 'Diese E-Mail ist bereits registriert.',
        action: { label: 'Stattdessen anmelden', mode: 'login' },
      };
    case 'auth/account-exists-with-different-credential':
      return {
        message: 'Ein Konto mit dieser E-Mail existiert bereits über eine andere Anmeldemethode.',
        action: { label: 'Mit E-Mail anmelden', mode: 'login' },
      };
    case 'auth/weak-password':
      return { message: 'Passwort muss mindestens 6 Zeichen haben.' };
    case 'auth/invalid-email':
      return { message: 'Ungültige E-Mail-Adresse.' };
    case 'auth/too-many-requests':
      return {
        message: 'Zu viele Versuche. Bitte warte kurz oder setze dein Passwort zurück.',
        action: { label: 'Passwort zurücksetzen', mode: 'reset' },
      };
    default:
      return { message: `Fehler (${code || 'unbekannt'}). Bitte versuche es erneut.` };
  }
}

export default function AuthScreen() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => { setMode(m); setAuthError(null); setInfo(''); };

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null); setInfo('');
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
      setAuthError(parseError(code, mode));
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

          {authError && (
            <div className="auth-error">
              <span>{authError.message}</span>
              {authError.action && (
                <button
                  type="button"
                  className="auth-error-action"
                  onClick={() => switchMode(authError.action!.mode)}
                >
                  {authError.action.label} →
                </button>
              )}
            </div>
          )}
          {info && <p className="auth-info">{info}</p>}

          <button className="btn btn-primary btn-lg" type="submit" disabled={busy} style={{ width: '100%' }}>
            {busy ? '…' : mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => switchMode('register')}>
                Noch kein Konto? Registrieren
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => switchMode('reset')}>
                Passwort vergessen
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button className="btn btn-ghost btn-sm" onClick={() => switchMode('login')}>
              ← Zurück zur Anmeldung
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
