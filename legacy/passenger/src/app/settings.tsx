import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@trustcab/core/auth';
import { notificationPermission, openSystemSettings, requestNotificationPermission } from '@trustcab/core/notifications';
import { SettingsScreen, type NotificationPermission } from '@trustcab/ui';

import { NOTIFICATIONS, setNotification, useProfile, type NotificationKind } from '@/data/profile';

const kinds = Object.keys(NOTIFICATIONS) as NotificationKind[];
const TRIP: NotificationKind[] = ['onTheWay', 'arrived', 'cancelled'];

// Configurações do passageiro: avisos da viagem e dos pedidos, sair e excluir a conta.
export default function Settings() {
  const { notifications } = useProfile();
  const { signOut, deleteAccount, user, devSession } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(null);

  useEffect(() => {
    notificationPermission().then(setPermission).catch(() => setPermission('undetermined'));
  }, []);

  const item = (kind: NotificationKind) => ({ key: kind, ...NOTIFICATIONS[kind], value: notifications[kind], onChange: (on: boolean) => setNotification(kind, on) });

  return (
    <SettingsScreen
      account={devSession ? 'Sessão de desenvolvimento, sem conta Google.' : (user?.email ?? '')}
      groups={[
        { title: 'Na hora da viagem', items: TRIP.map(item) },
        { title: 'Pedidos, conversas e cobranças', items: kinds.filter((k) => !TRIP.includes(k)).map(item) },
      ]}
      permission={permission}
      onRequestPermission={() => requestNotificationPermission().then(setPermission)}
      onOpenSystemSettings={openSystemSettings}
      onBack={() => router.back()}
      onSignOut={signOut}
      onDelete={deleteAccount}
      deleteText="Suas viagens, rotinas, conversas e seu celular são apagados, e você sai da rede de todos os motoristas. Não dá para desfazer."
    />
  );
}
