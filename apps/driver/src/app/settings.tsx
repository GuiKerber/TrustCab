import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@trustcab/core/auth';
import { setNotificationsEnabled } from '@trustcab/core/db';
import { SettingsScreen, type NotificationPermission } from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { NOTIFICATIONS, setNotification, useProfile, type NotificationKind } from '@/data/profile';
import { notificationPermission, openSystemSettings, requestNotificationPermission } from '@/lib/notifications';

const kinds = Object.keys(NOTIFICATIONS) as NotificationKind[];

// Configurações do motorista: avisos do próprio celular (viagens) e os que vêm dos passageiros.
export default function Settings() {
  const { notifications } = useProfile();
  const { uid } = useDriver();
  const { signOut, deleteAccount, user, devSession } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(null);

  useEffect(() => {
    notificationPermission().then(setPermission).catch(() => setPermission('undetermined'));
  }, []);

  const group = (title: string, source: 'local' | 'push') => ({
    title,
    items: kinds
      .filter((kind) => NOTIFICATIONS[kind].source === source)
      .map((kind) => ({
        key: kind,
        title: NOTIFICATIONS[kind].title,
        text: NOTIFICATIONS[kind].text,
        value: notifications[kind],
        onChange: (on: boolean) => {
          setNotification(kind, on);
          // O de push é o único que o servidor consulta antes de mandar.
          if (NOTIFICATIONS[kind].source === 'push' && uid) void setNotificationsEnabled(uid, on).catch(() => undefined);
        },
      })),
  });

  return (
    <SettingsScreen
      account={devSession ? 'Sessão de desenvolvimento, sem conta Google.' : (user?.email ?? '')}
      groups={[group('Viagens', 'local'), group('Do servidor', 'push')]}
      permission={permission}
      onRequestPermission={() => requestNotificationPermission().then(setPermission)}
      onOpenSystemSettings={openSystemSettings}
      onBack={() => router.back()}
      onSignOut={signOut}
      onDelete={deleteAccount}
      deleteText="Seu link sai do ar na hora, e seus passageiros, agendas, viagens, chave Pix e carro são apagados. Não dá para desfazer."
    />
  );
}
