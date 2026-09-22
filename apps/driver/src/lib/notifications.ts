import { useEffect } from 'react';

import { dayKey, FORGOTTEN_AFTER_MINUTES, startOpensAt, tripStart, type Trip } from '@trustcab/core';
import { NOTIFICATION_CHANNEL, notificationPermission, Notifications, notificationsSupported } from '@trustcab/core/notifications';

import type { NotificationKind } from '@/data/profile';

export { notificationPermission, openSystemSettings, requestNotificationPermission, useNotificationLinks, type PermissionState } from '@trustcab/core/notifications';

// Notificações que saem do próprio celular do motorista (não dependem de servidor nem de internet).
// As que vêm de outra pessoa (pedido, mensagem, convite aceito) chegam por push quando o backend existir.

const PREFIX = 'viagem-';
const MINUTE = 60_000;

export type ScheduledTrip = { date: Date; trip: Trip };

// Link que abre a viagem certa ao tocar na notificação.
export function tripUrl(date: Date, trip: Trip) {
  return `/trip/${trip.id}?day=${dayKey(date)}`;
}

// Reagenda os avisos das próximas viagens: "Hora de sair" quando libera o "Estou a caminho" e
// "Viagem sem conclusão" se ela passar do horário ainda aberta. Chamado sempre que a agenda muda.
async function schedule(items: ScheduledTrip[], prefs: Record<NotificationKind, boolean>) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled.filter((n) => n.identifier.startsWith(PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  const now = Date.now();
  const jobs: Promise<string>[] = [];
  for (const { date, trip } of items) {
    if (trip.status === 'completed' || trip.status === 'cancelled') continue;
    const firstName = trip.passenger.split(' ')[0];
    const url = tripUrl(date, trip);
    const opens = startOpensAt(date, trip).getTime();
    if (prefs.tripReminder && trip.status === 'scheduled' && opens > now) {
      jobs.push(
        Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX}sair-${trip.id}`,
          content: { title: 'Hora de sair', body: `Viagem das ${trip.time} com ${firstName}. Toque para avisar que está a caminho.`, data: { url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: opens, channelId: NOTIFICATION_CHANNEL },
        }),
      );
    }
    const forgotten = tripStart(date, trip.time).getTime() + (trip.etaMinutes + FORGOTTEN_AFTER_MINUTES) * MINUTE;
    if (prefs.forgottenTrip && forgotten > now) {
      jobs.push(
        Notifications.scheduleNotificationAsync({
          identifier: `${PREFIX}conclusao-${trip.id}`,
          content: { title: 'Viagem sem conclusão', body: `A viagem das ${trip.time} com ${firstName} já terminou? Toque para concluir.`, data: { url } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: forgotten, channelId: NOTIFICATION_CHANNEL },
        }),
      );
    }
  }
  await Promise.all(jobs);
}

export function useTripNotifications(items: ScheduledTrip[], prefs: Record<NotificationKind, boolean>) {
  const signature = items.map(({ trip }) => `${trip.id}:${trip.status}`).join('|') + JSON.stringify(prefs);
  useEffect(() => {
    if (!notificationsSupported) return;
    notificationPermission().then((status) => {
      if (status === 'granted') schedule(items, prefs).catch(() => undefined);
    });
    // A assinatura resume a lista: só reagenda quando uma viagem ou preferência muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);
}
