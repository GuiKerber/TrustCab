import { router } from 'expo-router';
import { Linking } from 'react-native';

import { notifyPassenger } from '@/data/chat';
import { usePassengerStore, withState } from '@/data/passengers';
import { setTripPaid, setTripReported, usePaidTrips, useReportedTrips } from '@/data/payments';
import { useProfile } from '@/data/profile';
import { driver, formatPrice, passengerIdOf, relativeDay, samplePassengers, type Trip, type TripStatus } from '@trustcab/core';
import { setTripSignal } from '@/data/tripSignals';

import { PREVIOUS_STATUS, type TripOption } from '@trustcab/ui';

// Ações da folha da viagem, iguais na home e na agenda.
// Cada passo que muda algo para o passageiro vira aviso no chat dele e notificação no celular dele.
export function useTripActions({ now, date, close }: { now: Date; date: Date; close: () => void }) {
  const passengers = withState(samplePassengers(now), usePassengerStore());
  const paid = usePaidTrips();
  const reported = useReportedTrips();
  const { vehicle } = useProfile();

  const phoneOf = (trip: Trip) => passengers.find((p) => p.name === trip.passenger)?.phone ?? null;
  const when = (trip: Trip, day: Date) => `${relativeDay(day, now).toLowerCase()}, ${trip.time}`;

  // Aviso ao passageiro para cada mudança que importa para ele. Desfazer um passo não avisa (o passo seguinte já corrige).
  const notice = (trip: Trip, from: TripStatus, to: TripStatus, day: Date) => {
    const id = passengerIdOf(trip.passenger);
    const me = driver.firstName;
    const car = vehicle ? `${vehicle.model} ${vehicle.color}, placa ${vehicle.plate}` : null;
    if (to === 'on_the_way' && from === 'scheduled') {
      notifyPassenger(id, `${me} está a caminho da partida (${trip.origin}).`, {
        title: `${me} está a caminho`,
        body: `Viagem das ${trip.time}, saindo de ${trip.origin}.`,
      }, to);
    } else if (to === 'arrived' && from === 'on_the_way') {
      notifyPassenger(id, `${me} chegou em ${trip.origin}.${car ? ` ${car}.` : ''}`, {
        title: `${me} chegou`,
        body: car ? `${car}. ${trip.origin}.` : trip.origin,
      }, to);
    } else if (to === 'completed') {
      notifyPassenger(id, `Viagem das ${trip.time} concluída · ${formatPrice(trip.priceCents)}.`, {
        title: 'Viagem concluída',
        body: `${formatPrice(trip.priceCents)} da viagem das ${trip.time}.`,
      }, to);
    } else if (to === 'cancelled') {
      notifyPassenger(id, `${me} cancelou a viagem de ${when(trip, day)}.`, {
        title: 'Viagem cancelada',
        body: `${me} cancelou a viagem de ${when(trip, day)}.`,
      }, to);
    } else if (to === 'scheduled' && from === 'cancelled') {
      notifyPassenger(id, `${me} reativou a viagem de ${when(trip, day)}.`, {
        title: 'Viagem reativada',
        body: `A viagem de ${when(trip, day)} voltou para a agenda.`,
      }, to);
    }
  };

  // "day": o dia da viagem, quando não é o dia aberto na tela (ex.: viagens esquecidas de ontem).
  const setStatus = (trip: Trip, status: TripStatus, day: Date = date) => {
    notice(trip, trip.status, status, day);
    setTripSignal(trip.id, status);
  };

  const openMaps = (address: string) =>
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`);

  const openChat = (trip: Trip) => router.push({ pathname: '/chat/[id]', params: { id: passengerIdOf(trip.passenger) } });

  const openSpending = (trip: Trip) => {
    close();
    router.navigate({ pathname: '/earnings', params: { passenger: trip.passenger, month: `${date.getFullYear()}-${date.getMonth()}` } });
  };

  // Toda ação pode ser desfeita pelos três pontos. Cancelar fica na própria folha, com confirmação.
  const options = (trip: Trip): TripOption[] => {
    const firstName = trip.passenger.split(' ')[0];
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
    if (isPaid) {
      notifyPassenger(passengerIdOf(trip.passenger), `${driver.firstName} confirmou o pagamento de ${formatPrice(trip.priceCents)} da viagem das ${trip.time}.`, {
        title: 'Pagamento confirmado',
        body: `${formatPrice(trip.priceCents)} da viagem das ${trip.time}.`,
      }, 'paid');
    }
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
  };
}
