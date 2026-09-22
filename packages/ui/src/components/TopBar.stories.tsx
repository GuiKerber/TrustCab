import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { TopBar } from './TopBar';

// Topo de todas as abas: o nome da página e o chat sempre à mão. O ponto laranja mostra mensagens não lidas.
const meta = {
  title: 'Componentes/Navegação/TopBar',
  component: TopBar,
  tags: ['autodocs'],
  args: { title: 'Olá, Carlos', unread: 0, onChat: fn() },
} satisfies Meta<typeof TopBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const ComNaoLidas: Story = { name: 'Com mensagens não lidas', args: { unread: 2 } };
