import { createStore, type Message } from '@trustcab/core';

// Conversas com os motoristas. As mensagens iniciais são exemplo (a conversa com o Carlos é a mesma do app dele).
// Vira coleção no Firestore quando o app for ligado ao backend.
type Store = { messages: Record<string, Message[]>; readAt: Record<string, Date> };

function seed(now: Date): Store {
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);
  return {
    messages: {
      carlos: [
        { id: 'ana-1', from: 'passenger', text: 'Oi, Carlos! Amanhã posso sair 10 min mais tarde?', at: at(26 * 60), status: 'sent' },
        { id: 'ana-2', from: 'driver', text: 'Pode sim, passo 07:40.', at: at(26 * 60 - 5) },
        { id: 'ana-3', from: 'passenger', text: 'Obrigada! Hoje à noite continua às 18h?', at: at(40), status: 'sent' },
      ],
    },
    readAt: { carlos: at(40) },
  };
}

const store = createStore<Store>(seed(new Date()));

export const useChat = store.use;

// Sem internet, o que você manda fica "enviando" e sai sozinho quando a conexão volta.
let online = true;

export function setOnline(next: boolean) {
  online = next;
  if (!next) return;
  const current = store.get();
  const messages = Object.fromEntries(
    Object.entries(current.messages).map(([id, list]) => [id, list.map((m) => (m.status === 'sending' ? { ...m, status: 'sent' as const } : m))]),
  );
  store.set({ ...current, messages });
}

export function sendMessage(driverId: string, text: string) {
  const current = store.get();
  const message: Message = { id: `${driverId}-${Date.now()}`, from: 'passenger', text, at: new Date(), status: online ? 'sent' : 'sending' };
  store.set({
    messages: { ...current.messages, [driverId]: [...(current.messages[driverId] ?? []), message] },
    readAt: { ...current.readAt, [driverId]: message.at },
  });
}

// Aviso automático para o motorista (você cancelou, avisou que pagou): mensagem no chat + notificação no celular dele.
export function notifyDriver(driverId: string, text: string, push: { title: string; body: string }, event: string) {
  const current = store.get();
  const message: Message = { id: `${driverId}-aviso-${Date.now()}`, from: 'system', text, at: new Date(), status: online ? 'sent' : 'sending', push, event };
  store.set({
    messages: { ...current.messages, [driverId]: [...(current.messages[driverId] ?? []), message] },
    readAt: { ...current.readAt, [driverId]: message.at },
  });
}

export function retryMessage(driverId: string, id: string) {
  const current = store.get();
  const list = (current.messages[driverId] ?? []).map((m) => (m.id === id ? { ...m, status: online ? ('sent' as const) : ('sending' as const) } : m));
  store.set({ ...current, messages: { ...current.messages, [driverId]: list } });
}

export function markRead(driverId: string) {
  const current = store.get();
  const last = current.messages[driverId]?.at(-1);
  if (!last || (current.readAt[driverId] && current.readAt[driverId] >= last.at)) return;
  store.set({ ...current, readAt: { ...current.readAt, [driverId]: last.at } });
}

export function unreadCount(current: Store, driverId: string) {
  const readAt = current.readAt[driverId];
  return (current.messages[driverId] ?? []).filter((m) => m.from === 'driver' && (!readAt || m.at > readAt)).length;
}

export function useUnreadTotal() {
  const current = useChat();
  return Object.keys(current.messages).reduce((sum, id) => sum + unreadCount(current, id), 0);
}
