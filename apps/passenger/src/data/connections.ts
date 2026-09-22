import { createStore } from '@trustcab/core';

import { sampleDriver, sampleInvites, type Driver } from './sample';

// Seu motorista. No MVP, um passageiro tem um motorista só: entra pelo convite (link ou código) e sai quando quiser.
// Para entrar na rede de outra pessoa, primeiro você sai da atual. Vira coleção no Firestore com o backend.
type Store = { joined: Driver | null; left: Record<string, Date> };

const store = createStore<Store>({ joined: null, left: {} });

export const useConnections = store.use;

export function joinDriver(driver: Driver) {
  const current = store.get();
  const left = { ...current.left };
  delete left[driver.id];
  store.set({ joined: { ...driver, since: new Date() }, left });
}

// Sair da rede: as viagens de hoje em diante saem da sua agenda; o histórico fica.
export function leaveDriver(id: string) {
  const current = store.get();
  store.set({ ...current, left: { ...current.left, [id]: new Date() } });
}

export function undoLeave(id: string) {
  const current = store.get();
  const left = { ...current.left };
  delete left[id];
  store.set({ ...current, left });
}

// Quem você já teve: o motorista de exemplo e quem você entrou por convite (mesmo que tenha saído).
export function knownDrivers(current: Store, now: Date) {
  const base = sampleDriver(now);
  return current.joined && current.joined.id !== base.id ? [base, current.joined] : [base];
}

// Seu motorista agora, ou null se você não está na rede de ninguém.
export function myDriver(current: Store, now: Date): Driver | null {
  if (current.joined && !current.left[current.joined.id]) return current.joined;
  const base = sampleDriver(now);
  return current.left[base.id] ? null : base;
}

// Convite pelo código (o final do link). null = código que não existe ou foi trocado pelo motorista.
export function findInvite(code: string, now: Date) {
  return sampleInvites(now)[code.trim().toLowerCase()] ?? null;
}
