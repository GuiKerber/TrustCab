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

// Gera o link de agendamento, ou troca por um novo e desativa o antigo. O endereço nasce no
// servidor para não ser previsível, e por isso o app nunca escreve em "links" — as regras proíbem.
// Exige telefone cadastrado: é por ele que o passageiro avisa no WhatsApp.
export const rotateLink = call<void, { slug: string }>('rotateLink');

// Exclui a conta de vez: perfil, link, passageiros, agendas e viagens.
export const deleteAccount = call<void, { deleted: boolean }>('deleteAccount');
