import { createStore } from '@trustcab/core';

// Viagens que o passageiro já pagou na hora (pelo QR Code). Ficam fora da cobrança do mês.
// Vira escrita no Firestore quando o app for ligado ao backend.
const paid = createStore<Record<string, Date>>({});

// null desfaz o "pago".
export function setTripPaid(id: string, at: Date | null) {
  const next = { ...paid.get() };
  if (at) next[id] = at;
  else delete next[id];
  paid.set(next);
}

export const usePaidTrips = paid.use;

// Viagens que o passageiro avisou pelo app dele que já pagou ("Já paguei"). Chegam pelo backend;
// você confere no banco e confirma, e aí a viagem vira paga.
const reported = createStore<Record<string, Date>>({});

export function setTripReported(id: string, at: Date | null) {
  const next = { ...reported.get() };
  if (at) next[id] = at;
  else delete next[id];
  reported.set(next);
}

export const useReportedTrips = reported.use;
