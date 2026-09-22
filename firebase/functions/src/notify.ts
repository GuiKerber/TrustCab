import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Ids iguais aos canais criados no app (mobile/src/lib/notifications.ts).
export type Channel = 'chegada' | 'mensagens' | 'agenda';

type Push = {
  channel: Channel;
  title: string;
  message: string;
  url: string;
};

const INVALID_TOKEN = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

// Mensagem só de dados no formato que o expo-notifications exibe: title, message, channelId e body (JSON com dados).
// Prioridade alta para aparecer mesmo com o celular em repouso.
export async function pushToUser(uid: string, push: Push): Promise<boolean> {
  const ref = getFirestore().doc(`users/${uid}`);
  const snap = await ref.get();
  const tokens: string[] = snap.get('fcmTokens') ?? [];
  if (tokens.length === 0) return false;

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    data: {
      title: push.title,
      message: push.message,
      channelId: push.channel,
      body: JSON.stringify({ url: push.url }),
    },
    android: {
      priority: 'high',
      ttl: push.channel === 'chegada' ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000,
    },
  });

  const invalid = tokens.filter((_, i) => {
    const result = response.responses[i];
    return !result.success && INVALID_TOKEN.has(result.error?.code ?? '');
  });
  if (invalid.length > 0) {
    await ref.update({ fcmTokens: FieldValue.arrayRemove(...invalid) });
  }
  return response.successCount > 0;
}

// Mensagem de sistema no chat (CH-04). Só as Functions escrevem esse tipo.
export async function addSystemMessage(connectionId: string, text: string, event: string) {
  const db = getFirestore();
  await db.collection(`connections/${connectionId}/messages`).add({
    type: 'system',
    senderId: null,
    text,
    event,
    createdAt: FieldValue.serverTimestamp(),
  });
  await db.doc(`connections/${connectionId}`).update({
    lastMessage: { text, senderId: null, at: FieldValue.serverTimestamp() },
    updatedAt: FieldValue.serverTimestamp(),
  });
}
