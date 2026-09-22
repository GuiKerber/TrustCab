import { router } from 'expo-router';

import { TopBar as BaseTopBar } from '@trustcab/ui';

import { useUnreadTotal } from '@/data/chat';

// Topo das abas do motorista: o TopBar do design system ligado às conversas deste app.
export function TopBar({ title }: { title: string }) {
  const unread = useUnreadTotal();
  return <BaseTopBar title={title} unread={unread} onChat={() => router.push('/chat')} />;
}
