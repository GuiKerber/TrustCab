import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { authConfigured, firebaseConfig } from '../auth/config';

// As Functions rodam em São Paulo: a região faz parte do endereço, e chamar sem ela
// cai em us-central1 e devolve "not found".
const REGION = 'southamerica-east1';

const functions = authConfigured
  ? getFunctions(getApps().length ? getApp() : initializeApp(firebaseConfig), REGION)
  : null;

function call<Req, Res>(name: string) {
  return async (data: Req): Promise<Res> => {
    if (!functions) throw new Error('Firebase não configurado');
    const result = await httpsCallable<Req, Res>(functions, name)(data);
    return result.data;
  };
}

// Gera um convite novo e desativa o anterior. O token nasce no servidor para não ser previsível,
// e por isso o app nunca escreve em "invites" — as regras proíbem.
// Exige veículo cadastrado: é ele que vai no cartão que o passageiro vê antes de aceitar.
export const rotateInvite = call<void, { token: string }>('rotateInvite');

// Exclui a conta de vez: perfil, conexões, agendas e conversas.
export const deleteAccount = call<void, { ok: boolean }>('deleteAccount');
