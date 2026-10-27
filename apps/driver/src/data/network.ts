import { useMemo } from 'react';

import { updatePassenger, usePassengers, type PassengerDoc } from '@trustcab/core/db';

// Os passageiros do motorista, vindos do Firestore.
//
// Na versão 2 não existe mais "esperando sua aprovação": quem abre o link já é alguém que ele
// conhece, e o que ele aprova é o pedido de agenda, não a pessoa. Por isso todo contato nasce
// ativo, e a única saída é arquivar.

export type ContactState = 'active' | 'archived';

export type Contact = {
  id: string;
  name: string;
  phone: string;
  note: string;
  since: Date;
  state: ContactState;
};

// Timestamp do Firestore vira Date. Enquanto a escrita não volta do servidor o campo vem null,
// e aí "agora" é a melhor aproximação — é o que a pessoa acabou de fazer.
function toDate(value: unknown): Date {
  const stamp = value as { toDate?: () => Date } | null;
  return stamp?.toDate ? stamp.toDate() : new Date();
}

export function useNetwork(uid: string | null) {
  const { data, loading, error } = usePassengers(uid);

  const passengers = useMemo<Contact[]>(
    () =>
      data
        .map((p: PassengerDoc & { id: string }) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          note: p.note ?? '',
          since: toDate(p.createdAt),
          state: (p.archived ? 'archived' : 'active') as ContactState,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [data],
  );

  return { passengers, loading, error };
}

// Tirar da lista sem apagar: a agenda e as viagens apontam para este contato, e sem o nome o
// histórico fica ilegível.
export const archivePassenger = (id: string) => updatePassenger(id, { archived: true });
export const restorePassenger = (id: string) => updatePassenger(id, { archived: false });
