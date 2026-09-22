import { useSyncExternalStore } from 'react';

import type { TripStatus } from '@trustcab/core';

// Estado dos avisos da viagem (a caminho, cheguei, cancelada) compartilhado entre a home e a tela da viagem.
// Vira escrita no Firestore quando o app for ligado ao backend.

let signals: Record<string, TripStatus> = {};
const listeners = new Set<() => void>();

export function setTripSignal(id: string, status: TripStatus) {
  setTripSignals([id], status);
}

// Várias viagens de uma vez (ex.: cancelar todas as viagens recorrentes do mesmo horário).
export function setTripSignals(ids: string[], status: TripStatus) {
  signals = { ...signals, ...Object.fromEntries(ids.map((id) => [id, status])) };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTripSignals() {
  return useSyncExternalStore(
    subscribe,
    () => signals,
    () => signals,
  );
}
