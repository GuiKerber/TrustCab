import { useMemo } from 'react';

import { updatePassenger, usePassengers, type PassengerDoc } from '@trustcab/core/db';

import type { PassengerWithState } from './passengers';

// Os passageiros do motorista, vindos do Firestore. Converte o documento para o mesmo formato que
// as telas já usam, para o banco entrar sem reescrever tela nenhuma.
//
// Na versão 2 não existe mais "esperando sua aprovação": quem abre o link já é alguém que o
// motorista conhece, e o que ele aprova é o pedido de agenda, não a pessoa. Por isso todo contato
// nasce ativo, e a única saída é arquivar.

// Timestamp do Firestore vira Date. Enquanto a escrita não volta do servidor o campo vem null,
// e aí "agora" é a melhor aproximação — é o que a pessoa acabou de fazer.
function toDate(value: unknown): Date {
  const stamp = value as { toDate?: () => Date } | null;
  return stamp?.toDate ? stamp.toDate() : new Date();
}

export function useNetwork(uid: string | null) {
  const { data, loading } = usePassengers(uid);

  const passengers = useMemo<PassengerWithState[]>(
    () =>
      data.map((p: PassengerDoc & { id: string }) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        status: 'active' as const,
        since: toDate(p.createdAt),
        state: p.archived ? ('ended' as const) : ('active' as const),
      })),
    [data],
  );

  return { passengers, loading, connected: uid !== null };
}

// Tirar da lista sem apagar: a agenda e as viagens apontam para este contato, e sem o nome o
// histórico fica ilegível.
export const archivePassenger = (id: string) => updatePassenger(id, { archived: true });
export const restorePassenger = (id: string) => updatePassenger(id, { archived: false });
