import { router } from 'expo-router';

import { TopBar as BaseTopBar } from '@trustcab/ui';

import { useNow } from '@trustcab/core';

import { useUnreadTotal } from '@/data/chat';
import { myDriver, useConnections } from '@/data/connections';

// Topo das abas do passageiro: o chat abre direto a conversa com o seu motorista (no MVP, um só).
// Sem motorista, leva para a entrada por convite.
export function TopBar({ title }: { title: string }) {
  const unread = useUnreadTotal();
  const driver = myDriver(useConnections(), useNow());
  return (
    <BaseTopBar
      title={title}
      unread={unread}
      onChat={() => (driver ? router.push({ pathname: '/chat/[id]', params: { id: driver.id } }) : router.push('/join'))}
    />
  );
}
