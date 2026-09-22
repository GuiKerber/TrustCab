import { formatPrice, type Trip, type TripStatus } from '@trustcab/core';
import { colors } from '../theme/tokens';

import type { RouteProgress } from './Route';

// Onde a seta está no percurso: sua localização → partida → destino.
export function routeProgress(status: Trip['status']): RouteProgress {
  switch (status) {
    case 'on_the_way':
      return 'toPickup';
    case 'arrived':
      return 'pickup';
    case 'in_progress':
      return 'toDestination';
    case 'completed':
      return 'destination';
    default:
      return 'location';
  }
}

// Encerrada: não vai mais acontecer (concluída, cancelada ou recusada pelo motorista).
export function isClosed(trip: Trip) {
  return trip.status === 'completed' || trip.status === 'cancelled' || trip.status === 'declined';
}

// Cor do cartão: cada viagem ativa do dia puxa uma cor; concluídas e canceladas ficam escuras.
export function cardColor(trip: Trip, index: number) {
  return isClosed(trip) ? colors.cardDone : colors.cards[index % colors.cards.length];
}

export function statusLabel(trip: Trip) {
  switch (trip.status) {
    case 'on_the_way':
      return 'A caminho';
    case 'arrived':
      return 'Na partida';
    case 'in_progress':
      return 'Em viagem';
    case 'completed':
      return 'Concluída';
    case 'cancelled':
      return 'Cancelada';
    case 'requested':
      return 'Esperando o motorista';
    case 'declined':
      return 'Recusada';
    default:
      return formatPrice(trip.priceCents);
  }
}

// Para cada estado, o passo anterior: toda ação pode ser desfeita pelos três pontos.
export const PREVIOUS_STATUS: Partial<Record<TripStatus, { status: TripStatus; label: string }>> = {
  on_the_way: { status: 'scheduled', label: 'Desfazer "a caminho"' },
  arrived: { status: 'on_the_way', label: 'Desfazer "cheguei"' },
  in_progress: { status: 'arrived', label: 'Desfazer início da viagem' },
  completed: { status: 'in_progress', label: 'Voltar para não concluída' },
  cancelled: { status: 'scheduled', label: 'Reativar viagem' },
};
