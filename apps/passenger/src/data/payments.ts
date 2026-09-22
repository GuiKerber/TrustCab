import { createStore, startOfDay } from '@trustcab/core';

// Pagamento das viagens concluídas. Você avisa que pagou ("Já paguei"); o motorista confere e confirma no app dele.
// Com o backend, o aviso chega ao motorista na hora e a confirmação dele volta para cá.
type Store = { reported: Record<string, Date>; confirmed: Record<string, Date> };

const store = createStore<Store>({ reported: {}, confirmed: {} });

export const usePayments = store.use;

// null desfaz o aviso (enquanto o motorista não confirmou).
export function reportPaid(ids: string[], at: Date | null) {
  const current = store.get();
  const reported = { ...current.reported };
  for (const id of ids) {
    if (at) reported[id] = at;
    else delete reported[id];
  }
  store.set({ ...current, reported });
}

export type PaymentState = 'paid' | 'reported' | 'due';

// Exemplo: meses anteriores já foram pagos e confirmados; o mês atual ainda está em aberto.
export function paymentState(current: Store, tripId: string, date: Date, now: Date): PaymentState {
  const firstOfMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  if (current.confirmed[tripId] || date < firstOfMonth) return 'paid';
  if (current.reported[tripId]) return 'reported';
  return 'due';
}

// Estado do pagamento em texto e ícone (nunca só cor).
export const PAYMENT_STATE = {
  paid: { label: 'Paga', icon: 'check_circle' },
  reported: { label: 'Esperando confirmar', icon: 'schedule' },
  due: { label: 'A pagar', icon: 'payments' },
} as const;
