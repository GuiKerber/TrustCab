import { isSameDay } from './sample';

// Mensagem de uma conversa entre motorista e passageiro. Os dois apps leem o mesmo formato.
// "sending" = esperando internet (sai sozinha quando a conexão volta), "sent" = saiu,
// "failed" = o servidor recusou (tente de novo). Entregue e lida vêm do servidor quando o backend existir.
export type MessageStatus = 'sending' | 'sent' | 'failed';

export type Message = {
  id: string;
  from: 'driver' | 'passenger' | 'system';
  text: string;
  at: Date;
  status?: MessageStatus;
  // Aviso automático da viagem: além do chat, vira notificação no celular da outra pessoa (Cloud Function onTripNotice).
  push?: { title: string; body: string };
  // Qual passo gerou o aviso (on_the_way, arrived…): define o canal da notificação.
  event?: string;
};

// Hoje: 14:05. Ontem: "ontem". Antes: 16/09.
export function messageTime(at: Date, now: Date) {
  if (isSameDay(at, now)) return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(at, yesterday)) return 'ontem';
  return `${String(at.getDate()).padStart(2, '0')}/${String(at.getMonth() + 1).padStart(2, '0')}`;
}
