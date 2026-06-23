import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => useContext(Ctx)!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, []);

  return (
    <Ctx.Provider value={{
      user,
      loading,
      signIn: (e, p) => signInWithEmailAndPassword(auth, e, p).then(() => {}),
      signUp: (e, p) => createUserWithEmailAndPassword(auth, e, p).then(() => {}),
      resetPassword: (e) => sendPasswordResetEmail(auth, e),
      logout: () => signOut(auth),
    }}>
      {children}
    </Ctx.Provider>
  );
}
