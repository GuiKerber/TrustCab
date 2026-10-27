import { Tabs } from 'expo-router';

import { useRequests } from '@trustcab/core/db';
import { colors, FloatingTabBar, type TabIcons } from '@trustcab/ui';

import { useDriver } from '@/data/driver';

const TABS: TabIcons = {
  index: { icon: 'home', label: 'Home' },
  agenda: { icon: 'calendar_month', label: 'Agenda' },
  passengers: { icon: 'group', label: 'Passageiros' },
  earnings: { icon: 'payments', label: 'Ganhos' },
  profile: { icon: 'person', label: 'Perfil' },
};

// Cinco destinos, sem rótulos: o menu é a pílula preta flutuante (FloatingTabBar).
// O número em Passageiros é quem está esperando resposta a um pedido do link.
export default function TabsLayout() {
  const { uid } = useDriver();
  const { data } = useRequests(uid);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar tabs={TABS} {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="passengers" options={{ tabBarBadge: data.length || undefined }} />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
