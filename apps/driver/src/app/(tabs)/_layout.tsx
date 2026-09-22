import { Tabs } from 'expo-router';
import { useMemo } from 'react';

import { colors, FloatingTabBar, type TabIcons } from '@trustcab/ui';
import { pendingRequests, usePassengerStore } from '@/data/passengers';
import { sampleTripRequests } from '@trustcab/core';

const TABS: TabIcons = {
  index: { icon: 'home', label: 'Home' },
  agenda: { icon: 'calendar_month', label: 'Agenda' },
  passengers: { icon: 'group', label: 'Passageiros' },
  earnings: { icon: 'payments', label: 'Ganhos' },
  profile: { icon: 'person', label: 'Perfil' },
};

// Cinco destinos, sem rótulos: o menu é a pílula preta flutuante (FloatingTabBar).
export default function TabsLayout() {
  const requests = useMemo(() => sampleTripRequests(new Date()), []);
  const waiting = pendingRequests(requests, usePassengerStore()).length;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar tabs={TABS} {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="passengers" options={{ tabBarBadge: waiting || undefined }} />
      <Tabs.Screen name="earnings" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
