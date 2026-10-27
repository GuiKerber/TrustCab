import { createStore, dayKey, routineDates, type Trip } from '@trustcab/core';

import { me } from './sample';

// Rotinas que você pediu nesta sessão, montadas dia por dia da semana: cada dia tem as viagens dele
// (ex.: segunda, 08:00 para o trabalho e 17:00 de volta para casa). Cada data vira um pedido que o motorista
// aprova ou recusa sozinho. Viagem recorrente repete toda semana e renova no começo de cada mês, até você parar;
// as outras valem só para a próxima data daquele dia da semana.
// Vira coleção no Firestore com o backend.
export type RoutineTrip = {
  weekday: number;
  time: string;
  origin: string;
  destination: string;
  priceCents: number;
  recurring: boolean;
};

export type Routine = {
  id: string;
  driverId: string;
  driverName: string;
  trips: RoutineTrip[];
  etaMinutes: number;
  note: string;
  createdAt: Date;
  // Parada: não renova mais. As viagens já aprovadas continuam.
  stoppedAt: Date | null;
};

const store = createStore<Routine[]>([]);

export const useRoutines = store.use;

export function addRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'stoppedAt'>) {
  const created: Routine = { ...routine, id: `rotina-${Date.now()}`, createdAt: new Date(), stoppedAt: null };
  store.set([...store.get(), created]);
  return created;
}

export function stopRoutine(id: string, at: Date | null) {
  store.set(store.get().map((r) => (r.id === id ? { ...r, stoppedAt: at } : r)));
}

// Datas de cada viagem: recorrente, todas até o fim do mês que vem (o resto entra na renovação); senão, só a próxima.
export function datesOfRoutineTrip(trip: Pick<RoutineTrip, 'weekday' | 'recurring'>, from: Date) {
  const dates = routineDates([trip.weekday], 'everyMonth', from);
  return trip.recurring ? dates : dates.slice(0, 1);
}

// Pedidos gerados por uma rotina, por dia.
export function tripsOfRoutine(routine: Routine) {
  return routine.trips.flatMap((slot, index) =>
    datesOfRoutineTrip(slot, routine.createdAt).map((date) => ({
      date,
      trip: {
        id: `${routine.id}-${dayKey(date).replace(/-/g, '')}-${index}`,
        time: slot.time,
        passenger: me.name,
        driver: routine.driverName,
        origin: slot.origin,
        destination: slot.destination,
        priceCents: slot.priceCents,
        etaMinutes: routine.etaMinutes,
        status: 'requested',
      } satisfies Trip,
    })),
  );
}

// Pedidos de todas as rotinas num mês, por dia.
export function routineTrips(routines: Routine[], month: Date): Record<string, Trip[]> {
  const out: Record<string, Trip[]> = {};
  for (const routine of routines) {
    for (const { date, trip } of tripsOfRoutine(routine)) {
      if (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) continue;
      out[dayKey(date)] = [...(out[dayKey(date)] ?? []), trip];
    }
  }
  return out;
}
