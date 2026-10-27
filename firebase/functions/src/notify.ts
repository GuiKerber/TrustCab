import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Id igual ao canal criado no app (NOTIFICATION_CHANNEL em packages/core/src/notifications.ts).
// Se os dois nomes se separarem, o Android joga o aviso num canal sem importância alta e ele
// deixa de aparecer com o celular em repouso.
export type Channel = 'viagens';

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
  // O interruptor de Configurações é consultado aqui: desligado, nada sai. Sem isto o botão
  // só mudaria de cor na tela e o celular continuaria apitando.
  if (snap.get('notificationsEnabled') === false) return false;
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
      ttl: 24 * 60 * 60 * 1000,
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
