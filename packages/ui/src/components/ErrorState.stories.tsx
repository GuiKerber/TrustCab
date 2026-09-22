import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { ErrorState } from './ErrorState';
import { OfflineNotice } from './OfflineNotice';

// Erro ao carregar: o que houve, o que fazer e "Tentar de novo". Também protege o app inteiro de erros inesperados.
const meta = {
  title: 'Componentes/Estados/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onRetry: fn(), onHome: fn() },
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const SemInternet: Story = { name: 'Sem internet', args: { offline: true } };

export const TentandoDeNovo: Story = { name: 'Tentando de novo', args: { retrying: true } };

export const ComDetalhe: Story = { name: 'Com detalhe técnico', args: { detail: 'TypeError: Cannot read properties of undefined (reading "trips")' } };

// Faixa do topo das telas quando o celular fica sem internet.
export const FaixaSemInternet: StoryObj<typeof OfflineNotice> = {
  name: 'OfflineNotice',
  parameters: { layout: 'padded' },
  render: () => <OfflineNotice force />,
};
