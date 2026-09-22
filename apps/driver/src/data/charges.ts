import { useSyncExternalStore } from 'react';

// Cobranças enviadas no chat, por passageiro e mês. Vira escrita no Firestore quando o app for ligado ao backend.

let sent: Record<string, Date> = {};
const listeners = new Set<() => void>();

export function chargeKey(passenger: string, month: Date) {
  return `${passenger}|${month.getFullYear()}-${month.getMonth()}`;
}

export function setChargeSent(key: string, at: Date | null) {
  const next = { ...sent };
  if (at) next[key] = at;
  else delete next[key];
  sent = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useChargesSent() {
  return useSyncExternalStore(
    subscribe,
    () => sent,
    () => sent,
  );
}
