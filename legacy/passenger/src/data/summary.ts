import { startOfDay, type Day, type Trip } from '@trustcab/core';

// Contas sobre as viagens com cada motorista: gasto do mês e os horários fixos (a rotina que se repete).

export function spentWith(days: Day[], driverName: string) {
  const done = days.flatMap((day) => day.trips).filter((trip) => trip.driver === driverName && trip.status === 'completed');
  return { trips: done.length, totalCents: done.reduce((sum, trip) => sum + trip.priceCents, 0) };
}

export type FixedSlot = { key: string; weekdays: number[]; time: string; origin: string; destination: string; waiting: number };

const DAY_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Horários que se repetem daqui para frente (mesma hora, partida e destino), com os dias da semana de cada um.
export function fixedSlots(days: Day[], driverName: string, now: Date): FixedSlot[] {
  const today = startOfDay(now);
  const slots = new Map<string, FixedSlot>();
  for (const day of days) {
    if (day.date < today) continue;
    for (const trip of day.trips as Trip[]) {
      if (trip.driver !== driverName || trip.status === 'cancelled' || trip.status === 'declined') continue;
      const key = `${trip.time}|${trip.origin}|${trip.destination}`;
      const slot = slots.get(key) ?? { key, weekdays: [], time: trip.time, origin: trip.origin, destination: trip.destination, waiting: 0 };
      if (!slot.weekdays.includes(day.date.getDay())) slot.weekdays.push(day.date.getDay());
      if (trip.status === 'requested') slot.waiting += 1;
      slots.set(key, slot);
    }
  }
  return [...slots.values()].sort((a, b) => a.time.localeCompare(b.time));
}

// "Seg a Sex", "Qua", "Seg, Qua e Sex".
export function weekdaysLabel(weekdays: number[]) {
  const sorted = [...weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  const weekdaysOnly = [1, 2, 3, 4, 5];
  if (sorted.length === 5 && weekdaysOnly.every((d) => sorted.includes(d))) return 'Seg a Sex';
  const labels = sorted.map((d) => DAY_LABEL[d]);
  return labels.length <= 1 ? (labels[0] ?? '') : `${labels.slice(0, -1).join(', ')} e ${labels.at(-1)}`;
}
