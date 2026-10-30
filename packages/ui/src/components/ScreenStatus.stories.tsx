import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ScreenStatus } from './ScreenStatus';

// Enquanto a tela carrega, o esqueleto com a estrutura dela; se a leitura falha, a tela de erro.
const meta = {
  title: 'Componentes/Estados/ScreenStatus',
  component: ScreenStatus,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { state: 'loading', layout: 'home', onRetry: fn() },
  argTypes: {
    state: { control: 'inline-radio', options: ['loading', 'error'] },
    layout: { control: 'inline-radio', options: ['home', 'agenda', 'list'] },
  },
} satisfies Meta<typeof ScreenStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const CarregandoHome: Story = { name: 'Carregando (Home)' };

export const CarregandoAgenda: Story = { name: 'Carregando (Agenda)', args: { layout: 'agenda' } };

export const Erro: Story = { args: { state: 'error' } };
