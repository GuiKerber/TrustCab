import './setup';

import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

// Exclusão de conta. Na versão 2 tudo o que existe pertence a um motorista só, então apagar a
// conta apaga de verdade: perfil, link, passageiros, agendas e viagens. Não há outra pessoa do
// outro lado da conexão para avisar nem histórico de terceiro para preservar.
//
// O link sai do ar na mesma hora: quem abrir o endereço depois disso lê "este link saiu do ar".
export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para excluí-la.');

  const db = getFirestore();
  const user = (await db.doc(`users/${uid}`).get()).data();
  const writer = db.bulkWriter();

  for (const collection of ['passengers', 'agendas', 'trips']) {
    const mine = await db.collection(collection).where('driverId', '==', uid).get();
    mine.docs.forEach((doc) => writer.delete(doc.ref));
  }

  if (user?.slug) writer.delete(db.doc(`links/${user.slug}`));
  writer.delete(db.doc(`users/${uid}`));
  await writer.close();

  await getAuth().deleteUser(uid);
  return { deleted: true };
});
