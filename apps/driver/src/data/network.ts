import { useMemo } from 'react';

import { answerConnection, endConnection, useConnections, type ConnectionDoc } from '@trustcab/core/db';

import type { PassengerState, PassengerWithState } from './passengers';

// A rede real do motorista, vinda do Firestore. Converte o documento de conexão para o mesmo
// formato que as telas já usam, para o Firestore entrar sem reescrever tela nenhuma.
//
// O mapa de estados é direto: o backend separa "convite esperando resposta" (pending) de
// "está na rede" (active), que é a mesma divisão das abas Pendentes e Ativos.
const STATE: Record<ConnectionDoc['status'], PassengerState> = {
  pending: 'invited',
  active: 'active',
  declined: 'cancelled',
  ended: 'ended',
};

// Timestamp do Firestore vira Date. Enquanto a escrita não volta do servidor o campo vem null,
// e aí "agora" é a melhor aproximação — é o que a pessoa acabou de fazer.
function toDate(value: unknown): Date {
  const stamp = value as { toDate?: () => Date } | null;
  return stamp?.toDate ? stamp.toDate() : new Date();
}

export function useNetwork(uid: string | null) {
  const { data, loading } = useConnections(uid, 'driver');

  const passengers = useMemo<PassengerWithState[]>(
    () =>
      data.map((c) => ({
        id: c.id,
        name: c.passenger?.name ?? 'Passageiro',
        phone: c.passenger?.phone ?? '',
        status: c.status === 'active' ? 'active' : 'invited',
        since: toDate(c.createdAt),
        state: STATE[c.status],
        // Quem está em pending entrou pelo seu link e espera você aprovar. Não é convite seu sem resposta:
        // no backend o convite é um código, não um documento por pessoa.
        asked: c.status === 'pending',
      })),
    [data],
  );

  return { passengers, loading, connected: uid !== null };
}

// Aprovar ou recusar quem pediu para entrar na rede. É a decisão que o protótipo nunca teve:
// no app local, quem abrisse o link entrava direto.
export const approve = (connectionId: string) => answerConnection(connectionId, 'active');
export const decline = (connectionId: string) => answerConnection(connectionId, 'declined');
export const removeFromNetwork = (connectionId: string, uid: string) => endConnection(connectionId, uid);
