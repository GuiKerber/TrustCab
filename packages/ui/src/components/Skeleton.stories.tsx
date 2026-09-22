import type { Meta, StoryObj } from '@storybook/react-native';

import { ScreenSkeleton } from './Skeleton';

// Carregando: a tela desenhada em blocos cinza, com a mesma estrutura, enquanto os dados chegam.
const meta = {
  title: 'Componentes/Estados/Skeleton',
  component: ScreenSkeleton,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { layout: 'home' },
  argTypes: { layout: { control: 'inline-radio', options: ['home', 'agenda', 'list', 'chat'] } },
} satisfies Meta<typeof ScreenSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Home: Story = {};

export const Agenda: Story = { args: { layout: 'agenda' } };

export const Lista: Story = { name: 'Lista (Ganhos, Passageiros)', args: { layout: 'list' } };

export const Conversas: Story = { args: { layout: 'chat' } };
