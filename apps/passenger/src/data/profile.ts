import { createStore } from '@trustcab/core';

// Seus dados no app: telefone (opcional), primeiro acesso e quais avisos receber.
// Vira escrita no Firestore quando o app for ligado ao backend.

// Todos chegam por push, do servidor: são coisas que o motorista faz.
export const NOTIFICATIONS = {
  onTheWay: { title: 'Motorista a caminho', text: 'Quando o motorista sair para te buscar.' },
  arrived: { title: 'Motorista chegou', text: 'Com o carro e a placa, para você achar rápido.' },
  answered: { title: 'Resposta dos pedidos', text: 'Quando o motorista aprovar ou recusar uma viagem.' },
  cancelled: { title: 'Viagem cancelada pelo motorista', text: 'Para você ter tempo de se organizar.' },
  message: { title: 'Mensagens', text: 'Quando o motorista escreve no chat.' },
  charge: { title: 'Cobranças', text: 'Quando chega a cobrança do mês.' },
} as const;

export type NotificationKind = keyof typeof NOTIFICATIONS;

export type Profile = {
  phone: string;
  onboarded: boolean;
  notifications: Record<NotificationKind, boolean>;
};

const initial: Profile = {
  phone: '',
  onboarded: false,
  notifications: Object.fromEntries(Object.keys(NOTIFICATIONS).map((kind) => [kind, true])) as Profile['notifications'],
};

const store = createStore<Profile>(initial);

export const useProfile = store.use;

export function setPhone(phone: string) {
  store.set({ ...store.get(), phone });
}

export function finishOnboarding() {
  store.set({ ...store.get(), onboarded: true });
}

export function setNotification(kind: NotificationKind, on: boolean) {
  const current = store.get();
  store.set({ ...current, notifications: { ...current.notifications, [kind]: on } });
}

export function resetProfile() {
  store.set(initial);
}
