import { useMemo } from 'react';

import {
  dayKey,
  startOfDay,
  type Day,
  type Trip,
  type TripStatus as ScreenStatus,
} from '@trustcab/core';
import { useAgendas, useTrips, type AgendaDoc, type TripDoc } from '@trustcab/core/db';

// O tradutor entre o banco e as telas.
//
// No banco existem duas coisas: a agenda (o combinado, que se repete) e a viagem (um dia que saiu
// do combinado — só vira documento quando alguém age nele). As telas, desde o primeiro desenho,
// pensam em Day[] e Trip: a lista de dias com as viagens de cada um. É aqui que uma vira a outra,
// e é por isso que ligar o Firestore não obrigou a redesenhar home, agenda e ganhos.
//
// Dia sem documento de viagem é "agendado": o combinado diz que ele existe e ninguém mexeu nele
// ainda. Guardar um documento por dia só para dizer "nada aconteceu" encheria o banco de nada.

type Agenda = AgendaDoc & { id: string };
type TripRow = TripDoc & { id: string };

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const weekdayOf = (date: Date) => date.getDay();

// Sem integração com mapas não existe tempo estimado. Zero é lido como "não sei" pelas telas,
// que escondem o bloco — melhor do que inventar um número que o motorista não pode conferir.
const NO_ETA = 0;

function serves(agenda: Agenda, date: Date, key: string) {
  if (agenda.status !== 'confirmed') return false;
  if (agenda.startDate && key < agenda.startDate) return false;
  return agenda.kind === 'recurring' ? (agenda.weekdays ?? []).includes(weekdayOf(date)) : agenda.date === key;
}

function statusOf(row: TripRow | undefined): ScreenStatus {
  if (!row) return 'scheduled';
  return row.status;
}

export function buildDays(agendas: Agenda[], trips: TripRow[], from: Date, to: Date): Day[] {
  const porId = new Map(trips.map((t) => [t.id, t]));
  const days: Day[] = [];

  for (let date = startOfDay(from); date <= to; date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)) {
    const key = iso(date);
    const doDia: Trip[] = [];

    for (const agenda of agendas) {
      if (!serves(agenda, date, key)) continue;
      const row = porId.get(`${agenda.id}_${key}`);
      doDia.push({
        id: `${agenda.id}_${key}`,
        time: agenda.time,
        passenger: agenda.passengerName,
        origin: agenda.origin,
        destination: agenda.destination,
        // Sem valor combinado, zero: a tela mostra isso como "sem valor" e ele acerta depois.
        priceCents: row?.price ?? agenda.price ?? 0,
        etaMinutes: NO_ETA,
        status: statusOf(row),
      });
    }

    doDia.sort((a, b) => a.time.localeCompare(b.time));
    days.push({ date: new Date(date), trips: doDia });
  }

  return days;
}

// O que o app precisa para gravar a viagem de um dia. A tela só tem o Trip, e o id dele carrega
// a agenda e a data; o resto vem da agenda.
export function tripBase(agendas: Agenda[], trip: Trip) {
  const corte = trip.id.lastIndexOf('_');
  const agendaId = trip.id.slice(0, corte);
  const date = trip.id.slice(corte + 1);
  const agenda = agendas.find((a) => a.id === agendaId);
  if (!agenda) return null;
  return {
    agendaId,
    driverId: agenda.driverId,
    passengerId: agenda.passengerId,
    date,
    time: agenda.time,
    price: agenda.price,
  };
}

export function phoneOfTrip(agendas: Agenda[], trip: Trip) {
  const agendaId = trip.id.slice(0, trip.id.lastIndexOf('_'));
  return agendas.find((a) => a.id === agendaId)?.passengerPhone ?? null;
}

// Os dias de um intervalo, ao vivo. Mudou a agenda ou alguém avisou que está a caminho, a tela
// se redesenha sozinha.
export function useDays(uid: string | null, from: Date, to: Date) {
  const agendas = useAgendas(uid);
  const trips = useTrips(uid, isoOf(from), isoOf(to));

  const days = useMemo(
    () => buildDays(agendas.data, trips.data, from, to),
    // As datas chegam como objetos novos a cada render; a chave é o dia, não a identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agendas.data, trips.data, dayKey(from), dayKey(to)],
  );

  // Quem já pagou. Vem da viagem, e não de um estado da sessão: fechar o app não pode fazer a
  // cobrança do mês voltar a incluir o que já foi pago.
  const paid = useMemo(() => new Set(trips.data.filter((t) => t.paidAt).map((t) => t.id)), [trips.data]);

  return {
    days,
    agendas: agendas.data,
    paid,
    loading: agendas.loading || trips.loading,
    error: agendas.error ?? trips.error,
  };
}

export const isoOf = iso;
