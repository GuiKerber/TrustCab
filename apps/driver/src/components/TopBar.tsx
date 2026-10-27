import { router } from 'expo-router';
import type { AndroidSymbol } from 'expo-symbols';

import { TopBar as BaseTopBar } from '@trustcab/ui';

import { useUnreadTotal } from '@/data/chat';

// Topo das abas do motorista: o TopBar do design system ligado às conversas deste app.
export function TopBar({ title, action }: { title: string; action?: { icon: AndroidSymbol; label: string; onPress: () => void } }) {
  const unread = useUnreadTotal();
  return <BaseTopBar title={title} unread={unread} action={action} onChat={() => router.push('/chat')} />;
}
