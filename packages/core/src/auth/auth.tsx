import { deleteUser, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { setDemoActive } from '../db/demo';
import { authConfigured, demoEnabled, googleClientIds, missingAuthKeys } from './config';
import { auth } from './firebase';

// No celular o login é o seletor de contas do próprio Android; no navegador é a janela do Google.
// A biblioteca nativa só é carregada fora da web, onde ela não existe.
type GoogleModule = typeof import('@react-native-google-signin/google-signin');

let google: GoogleModule | null = null;
let configured = false;

function googleNative() {
  if (!google) google = require('@react-native-google-signin/google-signin') as GoogleModule;
  if (!configured) {
    google.GoogleSignin.configure({
      webClientId: googleClientIds.webClientId,
      iosClientId: googleClientIds.iosClientId || undefined,
    });
    configured = true;
  }
  return google;
}

function errorCode(error: unknown) {
  return typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
}

// Devolve o id_token que o Firebase aceita, ou null quando a pessoa desiste.
async function signInNative() {
  const { GoogleSignin, statusCodes } = googleNative();
  await GoogleSignin.hasPlayServices();
  try {
    const response = await GoogleSignin.signIn();
    return response.type === 'success' ? response.data.idToken : null;
  } catch (caught) {
    const code = errorCode(caught);
    if (code === String(statusCodes.SIGN_IN_CANCELLED) || code === String(statusCodes.IN_PROGRESS)) return null;
    throw caught;
  }
}

type Status = 'loading' | 'signedOut' | 'signedIn';

// Por que a pessoa está no login: saiu, a sessão expirou sozinha ou a conta foi excluída.
export type SignedOutReason = 'expired' | 'deleted' | null;

type AuthContextValue = {
  status: Status;
  user: User | null;
  // Sem as chaves do Firebase o login não funciona; a tela diz o que falta.
  configured: boolean;
  missing: string[];
  busy: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  // Exclui a conta de vez. Devolve a mensagem de erro, se houver.
  deleteAccount: () => Promise<string | null>;
  reason: SignedOutReason;
  // Só em desenvolvimento: entrar para ver as telas sem conta (ex.: no Expo Go, onde o Google não deixa entrar).
  devSession: boolean;
  enterDevSession: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function explain(error: unknown) {
  const code = errorCode(error);
  if (code.includes('PLAY_SERVICES')) return 'Atualize o Google Play Services no seu celular e tente entrar de novo.';
  if (code.includes('popup-closed') || code.includes('cancelled')) return 'Você fechou o login do Google antes de terminar. Toque em entrar para tentar de novo.';
  if (code.includes('network')) return 'Sem internet agora. Confira a conexão e tente de novo.';
  if (code.includes('popup-blocked')) return 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.';
  return 'Não deu para entrar com o Google. Tente de novo em alguns segundos.';
}

// "onDeleted": o que cada app limpa quando a conta é excluída (perfil, preferências).
export function AuthProvider({ children, onDeleted }: { children: ReactNode; onDeleted?: () => void }) {
  const [status, setStatus] = useState<Status>(auth ? 'loading' : 'signedOut');
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devSession, setDevSession] = useState(false);
  const [reason, setReason] = useState<SignedOutReason>(null);
  // Saída pedida pela pessoa (sair ou excluir). Qualquer outra saída com sessão aberta é sessão expirada.
  const leaving = useRef(false);
  const current = useRef<User | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (next) => {
      if (current.current && !next && !leaving.current) setReason('expired');
      if (next) setReason(null);
      leaving.current = false;
      current.current = next;
      setUser(next);
      setStatus(next ? 'signedIn' : 'signedOut');
    });
  }, []);

  const signIn = async () => {
    if (!auth) {
      setError(`O login com Google ainda não está configurado. Faltam: ${missingAuthKeys.join(', ')}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (Platform.OS === 'web') {
        await signInWithPopup(auth, new GoogleAuthProvider());
      } else {
        const idToken = await signInNative();
        if (idToken) await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      }
    } catch (caught) {
      setError(explain(caught));
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    setReason(null);
    setDevSession(false);
    // Sem sair do Google junto, o seletor de contas não aparece na próxima vez.
    if (Platform.OS !== 'web') await googleNative().GoogleSignin.signOut().catch(() => {});
    if (auth?.currentUser) {
      leaving.current = true;
      await firebaseSignOut(auth);
    }
  };

  const deleteAccount = async () => {
    if (devSession || !auth?.currentUser) {
      onDeleted?.();
      setDevSession(false);
      setReason('deleted');
      return null;
    }
    try {
      leaving.current = true;
      await deleteUser(auth.currentUser);
      onDeleted?.();
      setReason('deleted');
      return null;
    } catch (caught) {
      leaving.current = false;
      const code = typeof caught === 'object' && caught && 'code' in caught ? String((caught as { code: string }).code) : '';
      if (code.includes('requires-recent-login')) return 'Por segurança, saia, entre de novo com o Google e tente excluir outra vez.';
      if (code.includes('network')) return 'Sem internet agora. Confira a conexão e tente de novo.';
      return 'Não deu para excluir a conta agora. Tente de novo em alguns minutos.';
    }
  };

  const value: AuthContextValue = {
    status: devSession ? 'signedIn' : status,
    user,
    configured: authConfigured,
    missing: missingAuthKeys,
    busy,
    error,
    signIn,
    signOut,
    deleteAccount,
    reason,
    devSession,
    enterDevSession: () => {
      if (!demoEnabled) return;
      // Liga o conjunto de exemplo: a partir daqui as leituras vêm dele e nenhuma escrita sai.
      setDemoActive(true);
      setDevSession(true);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
