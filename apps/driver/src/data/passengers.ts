import { useSyncExternalStore } from 'react';

import { dayKey, type Day, type MonthHistory, type Passenger, type PassengerStatus, type Trip, type TripRequest, type TripStatus } from '@trustcab/core';

// O que o motorista fez nesta sessão: convidar, cancelar convite, encerrar conexão e decidir cada pedido de viagem.
// Vira escrita no Firestore quando o app for ligado ao backend.
// "cancelled" e "ended" tiram o passageiro das listas, mas podem ser desfeitos.
export type PassengerState = PassengerStatus | 'cancelled' | 'ended';
export type RequestDecision = 'approved' | 'declined';

type Store = { status: Record<string, PassengerState>; invited: Passenger[]; decisions: Record<string, RequestDecision> };

let store: Store = { status: {}, invited: [], decisions: {} };
const listeners = new Set<() => void>();

function emit(next: Store) {
  store = next;
  listeners.forEach((listener) => listener());
}

export function setPassengerStatus(id: string, status: PassengerState) {
  emit({ ...store, status: { ...store.status, [id]: status } });
}

export function addInvite(passenger: Passenger) {
  emit({ ...store, invited: [passenger, ...store.invited] });
}

// null volta o pedido para "esperando você" (desfazer).
export function setRequestDecision(id: string, decision: RequestDecision | null) {
  const decisions = { ...store.decisions };
  if (decision) decisions[id] = decision;
  else delete decisions[id];
  emit({ ...store, decisions });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePassengerStore() {
  return useSyncExternalStore(
    subscribe,
    () => store,
    () => store,
  );
}

// Lista final: exemplos + convites feitos agora, com o estado atual de cada um.
export function withState(base: Passenger[], current: Store) {
  return [...current.invited, ...base].map((passenger) => ({
    ...passenger,
    state: (current.status[passenger.id] ?? passenger.status) as PassengerState,
  }));
}

export type PassengerWithState = ReturnType<typeof withState>[number];

// Pedidos que ainda esperam sua decisão.
export function pendingRequests(requests: TripRequest[], current: Store) {
  return requests.filter((request) => !current.decisions[request.id]);
}

// Pedidos aprovados viram viagens agendadas na agenda e na home.
export function withApprovedTrips(days: Day[], requests: TripRequest[], current: Store): Day[] {
  const approved = requests.filter((request) => current.decisions[request.id] === 'approved');
  if (approved.length === 0) return days;
  return days.map((day) => {
    const extra = approved
      .filter((request) => dayKey(request.date) === dayKey(day.date))
      .map(
        (request): Trip => ({
          id: request.id,
          time: request.time,
          passenger: request.passenger,
          origin: request.origin,
          destination: request.destination,
          priceCents: request.priceCents,
          etaMinutes: request.etaMinutes,
          status: 'scheduled',
        }),
      );
    return extra.length ? { ...day, trips: [...day.trips, ...extra].sort((a, b) => a.time.localeCompare(b.time)) } : day;
  });
}

// minutes: soma do tempo estimado das viagens concluídas, para a duração média.
export type MonthSpend = { month: Date; trips: number; totalCents: number; minutes: number };

// Viagens e gastos por mês de um passageiro. Como em Ganhos, só contam viagens concluídas.
export function passengerMonths(name: string, history: MonthHistory[], signals: Record<string, TripStatus>): MonthSpend[] {
  return history.map(({ month, days }) => {
    const done = days
      .flatMap((day) => day.trips)
      .filter((trip) => trip.passenger === name && (signals[trip.id] ?? trip.status) === 'completed');
    return {
      month,
      trips: done.length,
      totalCents: done.reduce((sum, trip) => sum + trip.priceCents, 0),
      minutes: done.reduce((sum, trip) => sum + trip.etaMinutes, 0),
    };
  });
}

// Encerrar a conexão tira da agenda todas as viagens dela a partir de hoje. O que já passou fica no histórico.
export function withoutEnded(days: Day[], passengers: { name: string; state: PassengerState }[], now: Date): Day[] {
  const ended = new Set(passengers.filter((p) => p.state === 'ended').map((p) => p.name));
  if (ended.size === 0) return days;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return days.map((day) => (day.date < today ? day : { ...day, trips: day.trips.filter((trip) => !ended.has(trip.passenger)) }));
}

// Mesmo número de celular (só os dígitos, com ou sem o 55). Para não convidar duas vezes a mesma pessoa.
export function samePhone(a: string, b: string) {
  const clean = (value: string) => value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return clean(a) === clean(b);
}
