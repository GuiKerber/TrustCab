// Os textos que o TrustCab escreve no WhatsApp. Nada sai sozinho: o app monta a mensagem e abre
// a conversa com ela escrita, e quem toca em enviar é a pessoa. É por isso que não há custo de
// mensagem, não há API no meio e não há modelo para a Meta aprovar.
//
// Regra que mantém o produto de pé: toda mensagem termina com o link da resposta mais provável.
// Sem isso, o passageiro responde em texto solto e o motorista vira o sincronizador manual.

import { bookingUrl } from './links';
import { dayLong, weekdayList, WEEKDAY_LONG } from './slots';

export type MessageAgenda = {
  kind: 'recurring' | 'single';
  weekdays: number[];
  date: string | null;
  time: string;
  origin: string;
  destination: string;
};

// "Toda segunda, quarta e sexta às 07:00" / "Terça-feira, 3 de novembro às 07:00"
export function whenLabel(agenda: Pick<MessageAgenda, 'kind' | 'weekdays' | 'date' | 'time'>) {
  if (agenda.kind === 'recurring') {
    const dias = weekdayList(agenda.weekdays);
    return `toda ${dias} às ${agenda.time}`;
  }
  return agenda.date ? `${dayLong(agenda.date)} às ${agenda.time}` : `às ${agenda.time}`;
}

export function routeLabel(agenda: Pick<MessageAgenda, 'origin' | 'destination'>) {
  return `${agenda.origin} → ${agenda.destination}`;
}

export function agendaSummary(agenda: MessageAgenda) {
  return `${whenLabel(agenda)}\n${routeLabel(agenda)}`;
}

// ─── O motorista divulgando o link ───────────────────────────────────────────

export function shareLink(driverName: string, slug: string) {
  return `Oi! Aqui é o ${driverName}. Para marcar sua carona comigo, é por este link:\n\n${bookingUrl(slug)}\n\nVocê escolhe o dia e o horário, e eu confirmo.`;
}

// ─── O passageiro avisando que pediu (sai da página de agendamento) ──────────

export function requestSent(driverName: string, passengerName: string, agenda: MessageAgenda) {
  return `Oi, ${driverName}! Aqui é o ${passengerName}. Acabei de pedir carona pelo seu link:\n\n${agendaSummary(agenda)}\n\nDá pra você?`;
}

// ─── O motorista respondendo ─────────────────────────────────────────────────

export function agendaConfirmed(passengerName: string, agenda: MessageAgenda, priceLabel?: string | null) {
  const valor = priceLabel ? `\nValor: ${priceLabel}` : '';
  return `${passengerName}, está combinado:\n\n${agendaSummary(agenda)}${valor}\n\nEu te aviso quando sair.`;
}

export function agendaDeclined(passengerName: string, agenda: MessageAgenda, slug: string) {
  return `${passengerName}, não vou conseguir ${whenLabel(agenda)}. Escolhe outro horário aqui que eu confirmo:\n\n${bookingUrl(slug)}`;
}

export function priceProposed(passengerName: string, agenda: MessageAgenda, priceLabel: string) {
  return `${passengerName}, consigo ${whenLabel(agenda)} por ${priceLabel}. Fecha assim?\n\n${routeLabel(agenda)}`;
}

// ─── Avisos da viagem ────────────────────────────────────────────────────────

export function onTheWay(passengerName: string, time: string) {
  return `${passengerName}, estou a caminho. Combinado das ${time}.`;
}

export function arrived(passengerName: string) {
  return `${passengerName}, cheguei. Estou te esperando.`;
}

export function tripCancelled(passengerName: string, date: string, slug: string) {
  return `${passengerName}, não vou conseguir ir ${dayLong(date)}. Se quiser marcar outro dia, é por aqui:\n\n${bookingUrl(slug)}`;
}

// Véspera: é esta mensagem que devolve a exceção como dado, porque leva o link junto.
export function tripReminder(passengerName: string, date: string, time: string, slug: string) {
  return `${passengerName}, amanhã (${dayLong(date)}) tem carona às ${time}. Se mudou algo, me avisa por aqui:\n\n${bookingUrl(slug)}`;
}

// ─── Cobrança do mês ─────────────────────────────────────────────────────────

export function monthlyCharge(
  passengerName: string,
  monthLabel: string,
  trips: number,
  totalLabel: string,
  pixKey?: string | null,
) {
  const pix = pixKey ? `\n\nChave Pix: ${pixKey}` : '';
  const plural = trips === 1 ? 'viagem' : 'viagens';
  return `${passengerName}, fechando ${monthLabel}: ${trips} ${plural}, total ${totalLabel}.${pix}`;
}

// Dia da semana escrito por extenso, para a mensagem não falar "1".
export const weekdayName = (weekday: number) => WEEKDAY_LONG[weekday];
