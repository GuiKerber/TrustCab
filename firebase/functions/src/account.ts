import './setup';

import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const DELETED_CARD = {
  name: 'Conta excluída',
  photoURL: null,
  phone: null,
  vehicle: null,
  notificationsEnabled: false,
};

// AC-04: apaga os dados pessoais, encerra conexões (a outra parte é avisada) e remove o login.
export const deleteAccount = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Entre na sua conta para excluí-la.');

  const db = getFirestore();
  const user = (await db.doc(`users/${uid}`).get()).data();
  const writer = db.bulkWriter();

  const [asDriver, asPassenger] = await Promise.all([
    db.collection('connections').where('driverId', '==', uid).get(),
    db.collection('connections').where('passengerId', '==', uid).get(),
  ]);

  for (const connection of [...asDriver.docs, ...asPassenger.docs]) {
    const data = connection.data();
    const myCard = data.driverId === uid ? 'driver' : 'passenger';

    // Mensagens escritas pela pessoa saem da conversa; o histórico do sistema fica para a outra parte.
    const mine = await connection.ref.collection('messages').where('senderId', '==', uid).get();
    mine.docs.forEach((message) => writer.delete(message.ref));

    // Uma escrita por documento. Encerrar dispara o aviso à outra parte e cancela as agendas (onConnectionWritten).
    writer.update(connection.ref, {
      [myCard]: DELETED_CARD,
      lastMessage: null,
      ...(data.status === 'active'
        ? { status: 'ended', endedBy: uid, accountDeleted: true, updatedAt: FieldValue.serverTimestamp() }
        : {}),
    });
  }

  if (user?.inviteToken) {
    writer.update(db.doc(`invites/${user.inviteToken}`), { active: false, driver: DELETED_CARD });
  }
  writer.delete(db.doc(`users/${uid}`));
  await writer.close();

  await getAuth().deleteUser(uid);
  return { deleted: true };
});
