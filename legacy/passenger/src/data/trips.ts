import { createStore, dayKey, startOfDay, type Day, type Trip, type TripStatus } from '@trustcab/core';

import { myDriver, useConnections } from './connections';
import { routineTrips, useRoutines } from './routines';
import { sampleTrips } from './sample';

// Estado das suas viagens nesta sessão: o que você cancelou e, com o backend, o que o motorista mudou.
// Vira leitura e escrita no Firestore quando o app for ligado ao backend.
const signals = createStore<Record<string, TripStatus>>({});

export const useTripSignals = signals.use;

export function setTripStatus(id: string, status: TripStatus) {
  signals.set({ ...signals.get(), [id]: status });
}

// Viagens de um mês com tudo aplicado: rotinas pedidas agora, cancelamentos e a saída da rede
// (as viagens de hoje em diante com quem você saiu somem; o histórico fica).
export function useMonthTrips(month: Date, now: Date): Day[] {
  const status = useTripSignals();
  const routines = useRoutines();
  const connections = useConnections();
  const current = myDriver(connections, now)?.name ?? null;
  const today = startOfDay(now);
  const extra = routineTrips(routines, month);
  return sampleTrips(month, now).map((day) => {
    const requested = extra[dayKey(day.date)] ?? [];
    const trips = [...day.trips, ...requested]
      .filter((trip) => day.date < today || trip.driver === current)
      .map((trip): Trip => ({ ...trip, status: status[trip.id] ?? trip.status }))
      .sort((a, b) => a.time.localeCompare(b.time));
    return { date: day.date, trips };
  });
}
