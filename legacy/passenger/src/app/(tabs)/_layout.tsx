import { Tabs } from 'expo-router';

import { colors, FloatingTabBar, type TabIcons } from '@trustcab/ui';

const TABS: TabIcons = {
  index: { icon: 'home', label: 'Home' },
  agenda: { icon: 'calendar_month', label: 'Agenda' },
  driver: { icon: 'directions_car', label: 'Motorista' },
  spending: { icon: 'account_balance_wallet', label: 'Gastos' },
  profile: { icon: 'person', label: 'Perfil' },
};

// Cinco destinos, o mesmo menu do motorista: só os ícones e os nomes mudam.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar tabs={TABS} {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ground } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="driver" />
      <Tabs.Screen name="spending" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
