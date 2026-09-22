import { useSyncExternalStore } from 'react';

import type { Message, MessageStatus } from '@trustcab/core';

export { messageTime, type Message, type MessageStatus } from '@trustcab/core';

// Conversas com os passageiros. As mensagens iniciais são exemplo, só para desenhar a tela.
// Vira coleção no Firestore quando o app for ligado ao backend.

type Store = { messages: Record<string, Message[]>; readAt: Record<string, Date> };

function seed(now: Date): Store {
  const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);
  return {
    messages: {
      ana: [
        { id: 'ana-1', from: 'passenger', text: 'Oi, Carlos! Amanhã posso sair 10 min mais tarde?', at: at(26 * 60) },
        { id: 'ana-2', from: 'driver', text: 'Pode sim, passo 07:40.', at: at(26 * 60 - 5) },
        { id: 'ana-3', from: 'passenger', text: 'Obrigada! Hoje à noite continua às 18h?', at: at(40) },
      ],
      julia: [
        { id: 'julia-1', from: 'driver', text: 'Bom dia, Júlia! Estou a caminho.', at: at(10 * 60) },
        { id: 'julia-2', from: 'passenger', text: 'Já estou descendo.', at: at(10 * 60 - 2) },
      ],
      pedro: [
        { id: 'pedro-1', from: 'system', text: 'Pedro aceitou seu convite e entrou na sua rede.', at: at(2 * 24 * 60) },
        { id: 'pedro-2', from: 'passenger', text: 'Pedi as viagens de seg, qua e sex às 08:00. Pode ser?', at: at(90) },
      ],
      marina: [{ id: 'marina-1', from: 'system', text: 'Marina aceitou seu convite e entrou na sua rede.', at: at(24 * 60) }],
    },
    // Lido até: Ana e Pedro têm mensagens novas.
    readAt: { ana: at(26 * 60 - 5), julia: at(10 * 60), pedro: at(2 * 24 * 60), marina: at(24 * 60) },
  };
}

let store: Store = seed(new Date());
const listeners = new Set<() => void>();

function emit(next: Store) {
  store = next;
  listeners.forEach((listener) => listener());
}

// Sem internet, o que você manda fica "enviando" e sai sozinho quando a conexão volta (como o Firestore faz).
let online = true;

export function setOnline(next: boolean) {
  online = next;
  if (!next) return;
  const messages = Object.fromEntries(
    Object.entries(store.messages).map(([id, list]) => [id, list.map((m) => (m.status === 'sending' ? { ...m, status: 'sent' as const } : m))]),
  );
  emit({ ...store, messages });
}

function append(passengerId: string, message: Message) {
  emit({
    messages: { ...store.messages, [passengerId]: [...(store.messages[passengerId] ?? []), message] },
    readAt: { ...store.readAt, [passengerId]: message.at },
  });
}

export function sendMessage(passengerId: string, text: string, id = `${passengerId}-${Date.now()}`) {
  append(passengerId, { id, from: 'driver', text, at: new Date(), status: online ? 'sent' : 'sending' });
}

// Aviso automático ao passageiro (a caminho, cheguei, concluída, cancelada…): mensagem no chat + notificação no celular dele.
export function notifyPassenger(passengerId: string, text: string, push: { title: string; body: string }, event: string) {
  append(passengerId, { id: `${passengerId}-aviso-${Date.now()}`, from: 'system', text, at: new Date(), status: online ? 'sent' : 'sending', push, event });
}

function setStatus(passengerId: string, id: string, status: MessageStatus) {
  const list = (store.messages[passengerId] ?? []).map((m) => (m.id === id ? { ...m, status } : m));
  emit({ ...store, messages: { ...store.messages, [passengerId]: list } });
}

// Chamado pelo backend quando a escrita é recusada.
export function markFailed(passengerId: string, id: string) {
  setStatus(passengerId, id, 'failed');
}

export function retryMessage(passengerId: string, id: string) {
  setStatus(passengerId, id, online ? 'sent' : 'sending');
}

export function removeMessage(passengerId: string, id: string) {
  emit({ ...store, messages: { ...store.messages, [passengerId]: (store.messages[passengerId] ?? []).filter((m) => m.id !== id) } });
}

export function markRead(passengerId: string) {
  const last = store.messages[passengerId]?.at(-1);
  if (!last || (store.readAt[passengerId] && store.readAt[passengerId] >= last.at)) return;
  emit({ ...store, readAt: { ...store.readAt, [passengerId]: last.at } });
}

export function unreadCount(current: Store, passengerId: string) {
  const readAt = current.readAt[passengerId];
  return (current.messages[passengerId] ?? []).filter((m) => m.from === 'passenger' && (!readAt || m.at > readAt)).length;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useChat() {
  return useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
}

export function useUnreadTotal() {
  const current = useChat();
  return Object.keys(current.messages).reduce((sum, id) => sum + unreadCount(current, id), 0);
}
