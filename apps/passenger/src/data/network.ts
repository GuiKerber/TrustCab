import { useMemo } from 'react';

import {
  connectionId,
  endConnection,
  requestConnection,
  useConnections,
  useDoc,
  type ConnectionDoc,
  type InviteDoc,
} from '@trustcab/core/db';

// A rede real do passageiro. No MVP é um motorista só, mas o backend já guarda a lista inteira
// (inclusive quem você deixou), porque o histórico de viagens continua ligado a cada conexão.

export type NetworkDriver = {
  id: string;
  connectionId: string;
  name: string;
  phone: string;
  // Carro e Pix vêm do cartão que a Function onUserUpdated mantém dentro da conexão: o
  // motorista troca o carro no app dele e isto muda aqui, sem ninguém avisar.
  vehicle: { model: string; color: string; plate: string } | null;
  pix: { type: string; key: string } | null;
  status: ConnectionDoc['status'];
  since: Date;
};

function toDate(value: unknown): Date {
  const stamp = value as { toDate?: () => Date } | null;
  return stamp?.toDate ? stamp.toDate() : new Date();
}

export function useNetwork(uid: string | null) {
  const { data, loading } = useConnections(uid, 'passenger');

  const drivers = useMemo<NetworkDriver[]>(
    () =>
      data.map((c) => ({
        id: c.driverId,
        connectionId: c.id,
        name: c.driver?.name ?? 'Motorista',
        phone: c.driver?.phone ?? '',
        vehicle: c.driver?.vehicle ?? null,
        pix: c.driver?.pix ?? null,
        status: c.status,
        since: toDate(c.createdAt),
      })),
    [data],
  );

  // Quem está valendo agora: a conexão ativa. "pending" ainda espera o motorista aprovar.
  const current = drivers.find((d) => d.status === 'active') ?? null;
  const waiting = drivers.find((d) => d.status === 'pending') ?? null;

  return { drivers, current, waiting, loading, connected: uid !== null };
}

// O convite lido pelo código. Só dá para ler quem tem o código em mãos: as regras proíbem listar.
export function useInvite(token: string | null) {
  return useDoc<InviteDoc>(token ? `invites/${token.toUpperCase()}` : null);
}

// Pedir para entrar na rede. Nasce "pending": quem decide é o motorista. No protótipo local
// isto entrava direto, e era a divergência mais séria entre o protótipo e o produto.
export function askToJoin(driverId: string, uid: string, token: string) {
  return requestConnection(driverId, uid, token.toUpperCase());
}

export function leaveNetwork(driverId: string, uid: string) {
  return endConnection(connectionId(driverId, uid), uid);
}
