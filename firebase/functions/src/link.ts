import './setup';

import { randomInt } from 'node:crypto';

import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

// O link de agendamento do motorista. Um por motorista, permanente: ele fixa no WhatsApp e não
// mexe mais. O endereço nasce aqui no servidor e não no app, por dois motivos: para o sorteio não
// ser previsível e para o app nunca escrever na coleção que a página pública lê.

// Sem letras e números fáceis de confundir (0/O, 1/I/L): o link é ditado por telefone.
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const RANDOM_LENGTH = 6;

function randomPart() {
  return Array.from({ length: RANDOM_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

// A parte legível é o primeiro nome. O sorteio vem depois e é o que torna o link difícil de
// adivinhar — sem ele, qualquer pessoa chegaria na agenda de qualquer "joao".
function base(name: string) {
  const first = String(name ?? '').trim().split(/\s+/)[0] ?? '';
  const plain = first.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const clean = plain.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean.length >= 2 ? clean.slice(0, 16) : 'motorista';
}

function card(user: Record<string, unknown>) {
  return {
    name: (user.name as string) ?? '',
    photoURL: (user.photoURL as string) ?? null,
    vehicle: (user.vehicle as unknown) ?? null,
  };
}

// Cria o link, ou troca por um novo e desativa o antigo. Trocar é a saída dele quando o link
// vazou para quem não devia: o endereço antigo passa a responder "link desativado".
export const rotateLink = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para gerar o link.');

  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const user = (await userRef.get()).data();
  if (!user) throw new HttpsError('not-found', 'Não encontrei seu perfil.');
  // Sem telefone o link não serve para nada: é por ele que o passageiro avisa no WhatsApp.
  if (!user.phone) throw new HttpsError('failed-precondition', 'Cadastre seu WhatsApp antes de gerar o link.');

  let slug = `${base(user.name as string)}-${randomPart()}`;
  while ((await db.doc(`links/${slug}`).get()).exists) slug = `${base(user.name as string)}-${randomPart()}`;

  const batch = db.batch();
  if (user.slug) {
    // Marca, não atualiza: se o endereço antigo tiver sumido do banco, "update" derruba o lote
    // inteiro e o motorista fica sem conseguir gerar link nenhum. Escrevendo por cima, o endereço
    // velho passa a responder "saiu do ar" mesmo que não exista mais — que é o recado certo para
    // quem guardou o link antigo.
    batch.set(
      db.doc(`links/${user.slug}`),
      { active: false, revokedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }
  batch.set(db.doc(`links/${slug}`), {
    driverId: uid,
    active: true,
    driver: card(user),
    createdAt: FieldValue.serverTimestamp(),
  });
  batch.update(userRef, { slug });
  await batch.commit();

  return { slug };
});
