import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import { authConfigured, firebaseConfig } from './config';

// Navegador: a sessão fica guardada pelo próprio Firebase (IndexedDB).
export const auth: Auth | null = authConfigured ? getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
