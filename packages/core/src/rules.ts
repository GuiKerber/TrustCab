import type { Trip } from './sample';

// Regras de horário das viagens. Valem para a home, a agenda e as notificações.

// "Estou a caminho" libera a partir de 60 min antes do horário da viagem.
export const START_WINDOW_MINUTES = 60;
// Passado o fim previsto (horário + tempo estimado) mais esta folga, a viagem aberta conta como esquecida.
export const FORGOTTEN_AFTER_MINUTES = 30;

const MINUTE = 60_000;

// Data e hora de saída de uma viagem num dia.
export function tripStart(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  return start;
}

export function startOpensAt(date: Date, trip: Trip) {
  return new Date(tripStart(date, trip.time).getTime() - START_WINDOW_MINUTES * MINUTE);
}

// Só "Estou a caminho" espera o horário; os passos seguintes já estão em andamento.
export function canStart(date: Date, trip: Trip, now: Date) {
  return trip.status !== 'scheduled' || now >= startOpensAt(date, trip);
}

export function isOpenTrip(trip: Trip) {
  return trip.status !== 'completed' && trip.status !== 'cancelled';
}

// Viagem que já deveria ter terminado e continua aberta: o motorista esqueceu de concluir.
export function isForgotten(date: Date, trip: Trip, now: Date) {
  const end = tripStart(date, trip.time).getTime() + (trip.etaMinutes + FORGOTTEN_AFTER_MINUTES) * MINUTE;
  return isOpenTrip(trip) && now.getTime() > end;
}

export function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
