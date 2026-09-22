import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { sampleMonth } from '@trustcab/core';

import { ChargeSheet } from './ChargeSheet';

// Prévia da cobrança do mês antes de enviar pelo chat: viagens concluídas e não pagas, total e a chave Pix.
const lines = sampleMonth(new Date())
  .days.flatMap((day) => day.trips.filter((trip) => trip.passenger === 'Ana Souza').map((trip) => ({ date: day.date, trip })))
  .slice(0, 6);
const total = lines.reduce((sum, line) => sum + (line.trip.priceCents ?? 0), 0);

const meta = {
  title: 'Motorista/ChargeSheet',
  component: ChargeSheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    visible: true,
    passenger: 'Ana Souza',
    monthLabel: 'Setembro',
    lines,
    totalCents: total,
    pixKey: '123.456.789-00',
    paidCount: 0,
    onSend: fn(),
    onAddPix: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof ChargeSheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

// Sem chave, não dá para enviar: o botão leva para o cadastro do Pix.
export const SemPix: Story = { name: 'Sem chave Pix', args: { pixKey: null } };

export const ComViagensPagas: Story = { name: 'Com viagens já pagas', args: { paidCount: 2 } };
