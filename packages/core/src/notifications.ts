import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';

// Permissão de notificação e toque na notificação, iguais nos dois apps.
// No navegador não há notificação, e o Expo Go (Android) trava só de carregar o pacote.
// Nos dois casos tudo aqui vira "não faz nada"; no app instalado (build de desenvolvimento ou loja), funciona.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const notificationsSupported = Platform.OS !== 'web' && !isExpoGo;

// Carregado só quando há suporte, para o Expo Go abrir o app.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const Notifications: typeof NotificationsModule = notificationsSupported ? require('expo-notifications') : (null as never);

export const NOTIFICATION_CHANNEL = 'viagens';

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function notificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// Pede a permissão do sistema. O Android só mostra o pedido uma vez; depois, só nas configurações do celular.
export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported) return 'unsupported';
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
      name: 'Viagens',
      description: 'Avisos das suas viagens',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

export function openSystemSettings() {
  Linking.openSettings().catch(() => undefined);
}

// Tocar numa notificação abre a tela dela (viagem, chat, pessoa), com o app aberto ou fechado.
export function useNotificationLinks() {
  // "notificationsSupported" não muda durante a execução, então a ordem dos hooks é sempre a mesma.
  const response = notificationsSupported ? Notifications.useLastNotificationResponse() : null;
  useEffect(() => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string') router.push(url as never);
  }, [response]);
}
