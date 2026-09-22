import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// A persistência do React Native só existe no build nativo do Firebase, que o Metro usa no celular.
// @ts-expect-error: a tipagem pública do firebase/auth é a do navegador.
import { getReactNativePersistence } from 'firebase/auth';

import { authConfigured, firebaseConfig } from './config';

// Celular: a sessão fica no AsyncStorage, para você continuar logado ao reabrir o app.
function createAuth(): Auth | null {
  if (!authConfigured) return null;
  if (getApps().length) return getAuth(getApp());
  const app = initializeApp(firebaseConfig);
  return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
}

export const auth = createAuth();
