import { router } from 'expo-router';
import { Linking } from 'react-native';

import { formatPrice, relativeDay, type Trip } from '@trustcab/core';
import type { TripOption } from '@trustcab/ui';

import { notifyDriver, sendMessage } from '@/data/chat';
import { knownDrivers, useConnections } from '@/data/connections';
import { reportPaid } from '@/data/payments';
import { me } from '@/data/sample';
import { setTripStatus } from '@/data/trips';

// Ações da folha da viagem do passageiro, iguais na Home e na Agenda.
// O que muda algo para o motorista vira aviso no chat dele (e notificação no celular dele, com o backend).
export function useTripActions({ now, date }: { now: Date; date: Date }) {
  const drivers = knownDrivers(useConnections(), now);
  const driverOf = (trip: Trip) => drivers.find((d) => d.name === trip.driver) ?? null;

  const openChat = (trip: Trip) => {
    const driver = driverOf(trip);
    if (driver) router.push({ pathname: '/chat/[id]', params: { id: driver.id } });
  };

  const options = (trip: Trip): TripOption[] => {
    const driver = driverOf(trip);
    if (!driver) return [];
    const first = driver.name.split(' ')[0];
    return [
      { key: 'call', label: `Ligar para ${first}`, icon: 'call', onPress: () => Linking.openURL(`tel:${driver.phone}`) },
      { key: 'driver', label: `Ver página de ${first}`, icon: 'person', onPress: () => router.navigate('/driver') },
    ];
  };

  const cancel = (trip: Trip) => {
    const driver = driverOf(trip);
    setTripStatus(trip.id, 'cancelled');
    if (!driver) return;
    const when = `${relativeDay(date, now).toLowerCase()}, ${trip.time}`;
    const what = trip.status === 'requested' ? 'o pedido da viagem' : 'a viagem';
    notifyDriver(driver.id, `${me.firstName} cancelou ${what} de ${when}.`, { title: 'Viagem cancelada', body: `${me.firstName} cancelou ${what} de ${when}.` }, 'cancelled');
  };

  const comingDown = (trip: Trip) => {
    const driver = driverOf(trip);
    if (driver) sendMessage(driver.id, 'Estou descendo.');
  };

  const setPaid = (trip: Trip, paid: boolean) => {
    reportPaid([trip.id], paid ? new Date() : null);
    const driver = driverOf(trip);
    if (paid && driver) {
      notifyDriver(
        driver.id,
        `${me.firstName} avisou que pagou ${formatPrice(trip.priceCents)} da viagem das ${trip.time}.`,
        { title: 'Pagamento avisado', body: `${me.firstName} pagou ${formatPrice(trip.priceCents)}. Confira e confirme.` },
        'paid_reported',
      );
    }
  };

  return { driverOf, openChat, options, cancel, comingDown, setPaid };
}
