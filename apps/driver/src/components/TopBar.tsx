import { router } from 'expo-router';
import type { AndroidSymbol } from 'expo-symbols';

import { useRequests } from '@trustcab/core/db';
import { TopBar as BaseTopBar } from '@trustcab/ui';

import { useDriver } from '@/data/driver';

// Topo das abas do motorista. Quando a página não tem ação própria, o canto direito é a caixa de
// pedidos com o número de quem está esperando — é o que ele precisa ver de qualquer tela.
export function TopBar({ title, action }: { title: string; action?: { icon: AndroidSymbol; label: string; onPress: () => void } }) {
  const { uid } = useDriver();
  const { data } = useRequests(uid);

  const pedidos = {
    icon: 'inbox' as AndroidSymbol,
    // O IconButton junta a contagem ao rótulo: "Pedidos, 2 esperando você".
    label: 'Pedidos',
    badge: data.length,
    onPress: () => router.push('/requests'),
  };

  return <BaseTopBar title={title} action={action ?? pedidos} />;
}
