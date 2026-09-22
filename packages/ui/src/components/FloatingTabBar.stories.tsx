import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FloatingTabBar, type TabIcons } from './FloatingTabBar';

// Menu do app, fundido ao fundo escuro e só com ícones. O item ativo ganha a pílula clara; o ponto laranja avisa pendência.
const TABS: TabIcons = {
  index: { icon: 'home', label: 'Home' },
  agenda: { icon: 'calendar_month', label: 'Agenda' },
  passengers: { icon: 'group', label: 'Passageiros' },
  earnings: { icon: 'payments', label: 'Ganhos' },
  profile: { icon: 'person', label: 'Perfil' },
};
const ROUTES = Object.keys(TABS).map((name) => ({ key: name, name }));

function TabBarDemo({ initial = 0, badge }: { initial?: number; badge?: string }) {
  const [index, setIndex] = useState(initial);
  return (
    <View style={styles.screen}>
      <FloatingTabBar
        tabs={TABS}
        state={{ index, routes: ROUTES }}
        navigation={{
          emit: () => ({ defaultPrevented: false }),
          navigate: (name) => setIndex(ROUTES.findIndex((route) => route.name === name)),
        }}
        descriptors={Object.fromEntries(ROUTES.map((route) => [route.key, { options: { tabBarBadge: route.name === badge ? 1 : undefined } }]))}
      />
    </View>
  );
}

const meta = {
  title: 'Componentes/Navegação/FloatingTabBar',
  component: TabBarDemo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { initial: 0 },
} satisfies Meta<typeof TabBarDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const ComPendencia: Story = { name: 'Com pendência', args: { badge: 'passengers' } };

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end' },
});
