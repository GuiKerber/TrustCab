import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { TopBar } from './TopBar';

// Topo de todas as abas: o nome da página e a ação dela. O número laranja mostra o que está
// esperando resposta atrás dessa ação — no app do motorista, os pedidos que chegaram pelo link.
const meta = {
  title: 'Componentes/Navegação/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  args: {
    title: 'Olá, Carlos',
    action: { icon: 'inbox', label: 'Pedidos esperando você', onPress: fn() },
  },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const ComPedidos: Story = {
  name: 'Com pedidos esperando',
  args: { action: { icon: 'inbox', label: '2 pedidos esperando você', badge: 2, onPress: fn() } },
};

export const SemAcao: Story = { name: 'Sem ação', args: { action: undefined } };
