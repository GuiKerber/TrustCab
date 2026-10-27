import { formatPrice, monthName, useNow, type Trip } from '@trustcab/core';

import { notifyDriver } from './chat';
import { knownDrivers, myDriver, useConnections } from './connections';
import { paymentState, reportPaid, usePayments } from './payments';
import { me } from './sample';
import { useMonthTrips } from './trips';

// O que falta pagar no mês: as viagens concluídas ainda em aberto, o total e quem recebe.
// Fica fora das telas porque dois lugares precisam da mesma conta — a página de Gastos e a
// cobrança que chega no chat. Com a conta repetida, os dois acabariam discordando.
export function useMonthDue(month: Date) {
  const now = useNow();
  const payments = usePayments();
  const connections = useConnections();
  const days = useMonthTrips(month, now);

  const done = days
    .map((day) => ({ date: day.date, trips: day.trips.filter((t) => t.status === 'completed') }))
    .flatMap((day) => day.trips.map((trip) => ({ date: day.date, trip })));
  const stateOf = ({ trip, date }: { trip: Trip; date: Date }) => paymentState(payments, trip.id, date, now);
  const due = done.filter((item) => stateOf(item) === 'due');
  const reported = done.filter((item) => stateOf(item) === 'reported');
  const dueTotal = due.reduce((sum, { trip }) => sum + trip.priceCents, 0);
  const driver = myDriver(connections, now) ?? knownDrivers(connections, now).find((d) => d.name === done[0]?.trip.driver) ?? null;
  const name = monthName(month);

  // Avisa o motorista que você pagou tudo. Ele confere no banco e confirma no app dele.
  const payAll = () => {
    if (!driver || due.length === 0) return;
    reportPaid(due.map(({ trip }) => trip.id), new Date());
    notifyDriver(
      driver.id,
      `${me.firstName} avisou que pagou ${formatPrice(dueTotal)} das viagens de ${name}.`,
      { title: 'Pagamento avisado', body: `${me.firstName} pagou ${formatPrice(dueTotal)} de ${name}. Confira e confirme.` },
      'paid_reported',
    );
  };

  return { driver, done, due, reported, dueTotal, name, payAll };
}
