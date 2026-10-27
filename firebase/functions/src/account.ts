import './setup';

import { getAuth } from 'firebase-admin/auth';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

// Exclusão de conta. Na versão 2 tudo o que existe pertence a um motorista só, então apagar a
// conta apaga de verdade: perfil, link, passageiros, agendas, viagens, cobranças e o travão de
// pedidos. Não há outra pessoa do outro lado para avisar nem histórico de terceiro a preservar.
//
// O link sai do ar na mesma hora: quem abrir o endereço depois disso lê "este link saiu do ar".
export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para excluí-la.');

  const db = getFirestore();
  const user = (await db.doc(`users/${uid}`).get()).data();
  const writer = db.bulkWriter();

  for (const collection of ['passengers', 'agendas', 'trips', 'charges']) {
    const mine = await db.collection(collection).where('driverId', '==', uid).get();
    mine.docs.forEach((doc) => writer.delete(doc.ref));
  }

  // O travão de pedidos guarda o telefone de quem pediu dentro do próprio id do documento
  // (driverId_telefone) e não tem campo driverId para consultar. Sem esta varredura, o telefone de
  // um passageiro sobreviveria à exclusão da conta do motorista — justamente o contrário do que a
  // política de privacidade promete.
  const limits = await db
    .collection('rateLimits')
    .orderBy(FieldPath.documentId())
    .startAt(`${uid}_`)
    .endAt(`${uid}_`)
    .get();
  limits.docs.forEach((doc) => writer.delete(doc.ref));

  if (user?.slug) writer.delete(db.doc(`links/${user.slug}`));
  writer.delete(db.doc(`users/${uid}`));
  await writer.close();

  await getAuth().deleteUser(uid);
  return { deleted: true };
});
