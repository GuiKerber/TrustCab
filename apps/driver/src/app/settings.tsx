import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useAuth } from '@trustcab/core/auth';
import { SettingsScreen, type NotificationPermission } from '@trustcab/ui';

import { NOTIFICATIONS, setNotification, useProfile, type NotificationKind } from '@/data/profile';
import { notificationPermission, openSystemSettings, requestNotificationPermission } from '@/lib/notifications';

const kinds = Object.keys(NOTIFICATIONS) as NotificationKind[];

// Configurações do motorista: avisos do próprio celular (viagens) e os que vêm dos passageiros.
export default function Settings() {
  const { notifications } = useProfile();
  const { signOut, deleteAccount, user, devSession } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(null);

  useEffect(() => {
    notificationPermission().then(setPermission).catch(() => setPermission('undetermined'));
  }, []);

  const group = (title: string, source: 'local' | 'push') => ({
    title,
    items: kinds
      .filter((kind) => NOTIFICATIONS[kind].source === source)
      .map((kind) => ({ key: kind, title: NOTIFICATIONS[kind].title, text: NOTIFICATIONS[kind].text, value: notifications[kind], onChange: (on: boolean) => setNotification(kind, on) })),
  });

  return (
    <SettingsScreen
      account={devSession ? 'Sessão de desenvolvimento, sem conta Google.' : (user?.email ?? '')}
      groups={[group('Viagens', 'local'), group('Passageiros', 'push')]}
      permission={permission}
      onRequestPermission={() => requestNotificationPermission().then(setPermission)}
      onOpenSystemSettings={openSystemSettings}
      onBack={() => router.back()}
      onSignOut={signOut}
      onDelete={deleteAccount}
      deleteText="Seus passageiros, viagens, conversas, chave Pix e carro são apagados, e todas as conexões são encerradas. Não dá para desfazer."
    />
  );
}
