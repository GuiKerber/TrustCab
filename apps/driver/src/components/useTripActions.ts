import { router } from 'expo-router';
import { Linking } from 'react-native';

import { phoneOfTrip, tripBase } from '@/data/days';
import { sendTo } from '@/data/whatsapp';
import { setTripPaidAt, setTripStatus, type AgendaDoc } from '@trustcab/core/db';
import {
  arrived,
  onTheWay,
  tripCancelled,
  type Trip,
  type TripStatus,
} from '@trustcab/core';

import { PREVIOUS_STATUS, type TripOption } from '@trustcab/ui';

// Ações da folha da viagem, iguais na home e na agenda.
//
// O passageiro não tem app: o único jeito de ele saber de alguma coisa é o WhatsApp. Então o
// toque faz duas coisas — grava o estado e abre a conversa com a mensagem escrita. Quem envia é
// o motorista. É um toque a mais do que a versão com app tinha, e esse é o preço honesto de não
// pedir instalação a ninguém.
//
// Só os três passos que mudam a vida do passageiro viram mensagem: a caminho, cheguei e
// cancelei. Concluir e marcar como pago são contabilidade do motorista, e avisar cada uma delas
// viraria conversa demais — isso fecha na cobrança do mês.

type Agenda = AgendaDoc & { id: string };

export function useTripActions({
  date,
  close,
  agendas,
  paid,
  slug,
}: {
  date: Date;
  close: () => void;
  agendas: Agenda[];
  paid: Set<string>;
  slug: string | null;
}) {
  const firstNameOf = (trip: Trip) => trip.passenger.split(' ')[0];

  // Abre o WhatsApp com o recado do passo. Desfazer um passo não avisa: o passo seguinte corrige.
  const notice = (trip: Trip, from: TripStatus, to: TripStatus, dia: string) => {
    const firstName = firstNameOf(trip);
    const phone = phoneOfTrip(agendas, trip);
    if (to === 'on_the_way' && from === 'scheduled') return sendTo(phone, onTheWay(firstName, trip.time));
    if (to === 'arrived' && from === 'on_the_way') return sendTo(phone, arrived(firstName));
    // A mensagem de cancelamento leva o link junto: é assim que ele remarca sem virar texto solto.
    if (to === 'cancelled') return sendTo(phone, tripCancelled(firstName, dia, slug ?? ''));
    return Promise.resolve({ ok: true } as const);
  };

  const setStatus = (trip: Trip, status: TripStatus) => {
    const base = tripBase(agendas, trip);
    // 'requested' e 'declined' são estados do lado do passageiro na versão 1; aqui não existem.
    if (!base || status === 'requested' || status === 'declined') return;
    const from = trip.status;
    void setTripStatus(base, status).catch(() => undefined);
    void notice(trip, from, status, base.date);
  };

  const openMaps = (address: string) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`);

  // O "conversar" da folha é a conversa de sempre do WhatsApp, sem texto nosso por cima.
  const openChat = (trip: Trip) => sendTo(phoneOfTrip(agendas, trip), '');

  const openSpending = (trip: Trip) => {
    close();
    router.navigate({ pathname: '/earnings', params: { passenger: trip.passengerId, month: `${date.getFullYear()}-${date.getMonth()}` } });
  };

  // Toda ação pode ser desfeita pelos três pontos. Cancelar fica na própria folha, com confirmação.
  const options = (trip: Trip): TripOption[] => {
    const firstName = firstNameOf(trip);
    const phone = phoneOfTrip(agendas, trip);
    const list: TripOption[] = [];
    const previous = PREVIOUS_STATUS[trip.status];
    if (previous) list.push({ key: 'undo', label: previous.label, icon: 'undo', onPress: () => setStatus(trip, previous.status) });
    if (phone) list.push({ key: 'call', label: `Ligar para ${firstName}`, icon: 'call', onPress: () => Linking.openURL(`tel:${phone}`) });
    list.push({ key: 'spending', label: `Ver gastos de ${firstName}`, icon: 'receipt_long', onPress: () => openSpending(trip) });
    return list;
  };

  const setPaid = (trip: Trip, isPaid: boolean) => {
    const base = tripBase(agendas, trip);
    if (!base) return;
    void setTripPaidAt(base, isPaid).catch(() => undefined);
  };

  // Carro ou Pix faltando: fecha a folha e abre o cadastro.
  const openSetup = (what: 'vehicle' | 'pix') => {
    close();
    router.push(what === 'vehicle' ? '/vehicle' : '/pix');
  };

  return {
    openMaps,
    openChat,
    openSpending,
    options,
    cancel: (trip: Trip) => setStatus(trip, 'cancelled'),
    setStatus,
    isPaid: (trip: Trip | null) => Boolean(trip && paid.has(trip.id)),
    // A versão 1 tinha o passageiro avisando "já paguei" pelo app dele. Sem app, quem marca é
    // o motorista, quando o dinheiro cai.
    isReported: () => false,
    setPaid,
    openSetup,
  };
}
