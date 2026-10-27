import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { authConfigured, firebaseConfig } from '../auth/config';

// O Firestore usa o mesmo app do Firebase que a autenticação já inicializa. Sem as chaves
// configuradas ele fica null, e os hooks devolvem "sem dados" em vez de estourar — é o que
// mantém a versão de demonstração (sem conta) funcionando com os dados de exemplo.
export const db: Firestore | null = authConfigured
  ? getFirestore(getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const dbReady = db !== null;
