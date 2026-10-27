import { router } from 'expo-router';
import { Linking } from 'react-native';

import { usePassengerStore, withState } from '@/data/passengers';
import { setTripPaid, setTripReported, usePaidTrips, useReportedTrips } from '@/data/payments';
import { useDriver } from '@/data/driver';
import { sendTo } from '@/data/whatsapp';
import {
  arrived,
  formatPrice,
  onTheWay,
  relativeDay,
  samplePassengers,
  tripCancelled,
  type Trip,
  type TripStatus,
} from '@trustcab/core';
import { setTripSignal } from '@/data/tripSignals';

import { PREVIOUS_STATUS, type TripOption } from '@trustcab/ui';

// Ações da folha da viagem, iguais na home e na agenda.
//
// O passageiro não tem app: o único jeito de ele saber de alguma coisa é o WhatsApp. Então o
// toque faz duas coisas — muda o estado aqui, na hora, e abre a conversa com a mensagem escrita.
// Quem envia é o motorista. É um toque a mais do que a versão com app tinha, e esse é o preço
// honesto de não pedir instalação a ninguém.
//
// Só os três passos que mudam a vida do passageiro viram mensagem: a caminho, cheguei e
// cancelei. Concluir a viagem e marcar como pago são contabilidade do motorista, e avisar cada
// uma vira conversa demais — isso fecha na cobrança do mês.
export function useTripActions({ now, date, close }: { now: Date; date: Date; close: () => void }) {
  const passengers = withState(samplePassengers(now), usePassengerStore());
  const paid = usePaidTrips();
  const reported = useReportedTrips();
  const { slug } = useDriver();

  const phoneOf = (trip: Trip) => passengers.find((p) => p.name === trip.passenger)?.phone ?? null;
  const when = (trip: Trip, day: Date) => `${relativeDay(day, now).toLowerCase()}, ${trip.time}`;
  const firstNameOf = (trip: Trip) => trip.passenger.split(' ')[0];

  // Abre o WhatsApp com o recado do passo. Desfazer um passo não avisa: o passo seguinte corrige.
  const notice = (trip: Trip, from: TripStatus, to: TripStatus, day: Date) => {
    const firstName = firstNameOf(trip);
    if (to === 'on_the_way' && from === 'scheduled') {
      return sendTo(phoneOf(trip), onTheWay(firstName, trip.time));
    }
    if (to === 'arrived' && from === 'on_the_way') {
      return sendTo(phoneOf(trip), arrived(firstName));
    }
    if (to === 'cancelled') {
      // A mensagem leva o link junto: é assim que ele remarca sem virar texto solto.
      return sendTo(phoneOf(trip), tripCancelled(firstName, dayKeyOf(day), slug ?? ''));
    }
    return Promise.resolve({ ok: true } as const);
  };

  // "day": o dia da viagem, quando não é o dia aberto na tela (ex.: viagens esquecidas de ontem).
  const setStatus = (trip: Trip, status: TripStatus, day: Date = date) => {
    const from = trip.status;
    setTripSignal(trip.id, status);
    void notice(trip, from, status, day);
  };

  const openMaps = (address: string) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`);

  // O "conversar" da folha é a conversa de sempre do WhatsApp, sem texto nosso por cima.
  const openChat = (trip: Trip) => sendTo(phoneOf(trip), '');

  const openSpending = (trip: Trip) => {
    close();
    router.navigate({ pathname: '/earnings', params: { passenger: trip.passenger, month: `${date.getFullYear()}-${date.getMonth()}` } });
  };

  // Toda ação pode ser desfeita pelos três pontos. Cancelar fica na própria folha, com confirmação.
  const options = (trip: Trip): TripOption[] => {
    const firstName = firstNameOf(trip);
    const phone = phoneOf(trip);
    const list: TripOption[] = [];
    const previous = PREVIOUS_STATUS[trip.status];
    if (previous) list.push({ key: 'undo', label: previous.label, icon: 'undo', onPress: () => setStatus(trip, previous.status) });
    if (phone) list.push({ key: 'call', label: `Ligar para ${firstName}`, icon: 'call', onPress: () => Linking.openURL(`tel:${phone}`) });
    list.push({ key: 'spending', label: `Ver gastos de ${firstName}`, icon: 'receipt_long', onPress: () => openSpending(trip) });
    return list;
  };

  const setPaid = (trip: Trip, isPaid: boolean) => {
    setTripPaid(trip.id, isPaid ? new Date() : null);
    if (isPaid) setTripReported(trip.id, null);
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
    isPaid: (trip: Trip | null) => Boolean(trip && paid[trip.id]),
    isReported: (trip: Trip | null) => Boolean(trip && reported[trip.id]),
    setPaid,
    openSetup,
    when,
    formatPrice,
  };
}

// As mensagens falam a data por extenso, e a data delas é AAAA-MM-DD.
function dayKeyOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
