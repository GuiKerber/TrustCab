import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

// Importado primeiro por todos os módulos: a região precisa ser definida antes de declarar as funções.
// Mesma região do Firestore (crie o banco em southamerica-east1) e do app (mobile/src/lib/firebase.ts).
export const REGION = 'southamerica-east1';

initializeApp();
setGlobalOptions({ region: REGION, maxInstances: 10 });
