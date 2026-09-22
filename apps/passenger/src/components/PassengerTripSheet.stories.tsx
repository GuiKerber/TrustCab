import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import type { TripStatus } from '@trustcab/core';
import { colors } from '@trustcab/ui';
import { LONG_ADDRESSES } from '@trustcab/ui/storybook';

import type { PaymentState } from '@/data/payments';
import { sampleDriver, sampleTrips } from '@/data/sample';

import { PassengerTripSheet } from './PassengerTripSheet';

// Folha da viagem do lado do passageiro: a mesma estrutura do motorista, com quem dirige e o carro em destaque.
// Cada estado diz em que pé a viagem está; quando o motorista chega, "Estou descendo"; concluída, "Já paguei".
const now = new Date();
const carlos = sampleDriver(now);
const base = sampleTrips(now, now).flatMap((day) => day.trips).find((trip) => trip.driver === carlos.name)!;

function Demo({ status = 'scheduled', payment: startPayment = 'due', color = colors.cards[0], long = false }: { status?: TripStatus; payment?: PaymentState; color?: string; long?: boolean }) {
  const [payment, setPayment] = useState<PaymentState>(startPayment);
  const trip = { ...base, status, ...(long ? { origin: LONG_ADDRESSES.einstein, destination: LONG_ADDRESSES.airport } : {}) };
  return (
    <PassengerTripSheet
      trip={trip}
      driver={carlos}
      color={color}
      date={now}
      now={now}
      visible
      onClose={fn()}
      onChat={fn()}
      options={[{ key: 'call', label: 'Ligar para Carlos', icon: 'call', onPress: fn() }]}
      onCancel={fn()}
      onComingDown={fn()}
      payment={payment}
      onReportPaid={(_, paid) => setPayment(paid ? 'reported' : 'due')}
    />
  );
}

const meta = {
  title: 'Passageiro/PassengerTripSheet',
  component: Demo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { status: 'scheduled', payment: 'due', color: colors.cards[0] },
  argTypes: {
    status: { control: 'select', options: ['requested', 'declined', 'scheduled', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'] },
    payment: { control: 'inline-radio', options: ['due', 'reported', 'paid'] },
    color: { control: 'select', options: colors.cards },
  },
} satisfies Meta<typeof Demo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EsperandoAprovacao: Story = { name: 'Esperando aprovação', args: { status: 'requested', color: colors.cards[2] } };

export const Confirmada: Story = {};

export const ACaminho: Story = { name: 'Motorista a caminho', args: { status: 'on_the_way', color: colors.cards[1] } };

export const Chegou: Story = { name: 'Motorista chegou', args: { status: 'arrived', color: colors.cards[3] } };

export const EmViagem: Story = { name: 'Em viagem', args: { status: 'in_progress', color: colors.cards[4] } };

export const ConcluidaAPagar: Story = { name: 'Concluída, a pagar', args: { status: 'completed' } };

export const AvisouQuePagou: Story = { name: 'Avisou que pagou', args: { status: 'completed', payment: 'reported' } };

export const Paga: Story = { args: { status: 'completed', payment: 'paid' } };

export const Recusada: Story = { args: { status: 'declined', color: colors.cardDone } };

export const Cancelada: Story = { args: { status: 'cancelled', color: colors.cardDone } };

export const EnderecosLongos: Story = { name: 'Endereços longos', args: { long: true } };
