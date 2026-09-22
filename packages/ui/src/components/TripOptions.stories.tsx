import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { TripOptions } from './TripOptions';

// Menu "⋯" que sobe do rodapé. Ação destrutiva fica em laranja e com ícone próprio.
const meta = {
  title: 'Componentes/Camadas/TripOptions',
  component: TripOptions,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    visible: true,
    inline: true,
    title: 'Ana Souza · 07:40',
    onClose: fn(),
    options: [
      { key: 'chat', label: 'Mandar mensagem', icon: 'chat', onPress: fn() },
      { key: 'undo', label: 'Desfazer "cheguei"', icon: 'undo', onPress: fn() },
      { key: 'cancel', label: 'Cancelar viagem', icon: 'close', destructive: true, onPress: fn() },
    ],
  },
} satisfies Meta<typeof TripOptions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };
