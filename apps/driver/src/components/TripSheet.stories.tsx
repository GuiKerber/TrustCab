import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { getProfile, setPix, setVehicle } from '@/data/profile';
import { sampleMonth, type Trip, type TripStatus } from '@trustcab/core';
import { colors } from '@trustcab/ui';

import { LONG_ADDRESSES, timeIn } from '@trustcab/ui/storybook';
import { TripSheet } from './TripSheet';

// Viagem aberta: a folha cresce a partir do cartão, na mesma cor. As ações seguem a ordem
// a caminho → cheguei → começar → concluir. "Estou a caminho" só libera 1 hora antes, e só com carro e Pix cadastrados.
// Concluída: fundo cinza, QR Code Pix e "Marcar como pago".
const now = new Date();
const base = sampleMonth(now).days.flatMap((day) => day.trips)[0];

type DemoProps = {
  status?: TripStatus;
  color?: string;
  // Minutos até o horário da viagem. Mais de 60 = "Estou a caminho" bloqueado.
  startsIn?: number;
  setup?: boolean;
  paid?: boolean;
  // O passageiro avisou pelo app dele que já pagou.
  reported?: boolean;
  long?: boolean;
};

function TripSheetDemo({ status = 'scheduled', color = colors.cards[0], startsIn = 30, setup = true, paid: startPaid = false, reported = false, long = false }: DemoProps) {
  // O perfil é global: cada story começa com o carro e o Pix que ela precisa.
  useState(() => {
    const profile = getProfile();
    if (setup && !profile.vehicle) setVehicle({ model: 'Onix', color: 'prata', plate: 'FTR4E21' });
    if (setup && !profile.pix) setPix({ type: 'cpf', key: '123.456.789-00' });
    if (!setup) {
      setVehicle(null);
      setPix(null);
    }
    return null;
  });
  const [trip, setTrip] = useState<Trip>({
    ...base,
    time: timeIn(startsIn, now),
    status,
    ...(long ? { origin: LONG_ADDRESSES.hospital, destination: LONG_ADDRESSES.shopping } : {}),
  });
  const [paid, setPaid] = useState(startPaid);
  return (
    <TripSheet
      trip={trip}
      color={color}
      date={now}
      now={now}
      visible
      onClose={fn()}
      onStatus={(_, next) => setTrip({ ...trip, status: next })}
      onMaps={fn()}
      onChat={fn()}
      onSpending={fn()}
      onCancel={() => setTrip({ ...trip, status: 'cancelled' })}
      paid={paid}
      paidByPassenger={reported && !paid}
      onPaid={(_, value) => setPaid(value)}
      onSetup={fn()}
      options={() => [{ key: 'spending', label: 'Ver gastos', icon: 'receipt_long', onPress: fn() }]}
    />
  );
}

const meta = {
  title: 'Motorista/TripSheet',
  component: TripSheetDemo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { status: 'scheduled', color: colors.cards[0], startsIn: 30, setup: true, paid: false, long: false },
  argTypes: {
    status: { control: 'select', options: ['scheduled', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled'] },
    color: { control: 'select', options: colors.cards },
  },
} satisfies Meta<typeof TripSheetDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Agendada: Story = {};

export const BloqueadaPorHorario: Story = { name: 'Bloqueada por horário', args: { startsIn: 180 } };

export const SemCarroEPix: Story = { name: 'Sem carro e Pix', args: { setup: false } };

export const ACaminho: Story = { name: 'A caminho', args: { status: 'on_the_way', color: colors.cards[1] } };

export const EmViagem: Story = { name: 'Em viagem', args: { status: 'in_progress', color: colors.cards[2] } };

export const Concluida: Story = { name: 'Concluída', args: { status: 'completed' } };

export const ConcluidaPaga: Story = { name: 'Concluída e paga', args: { status: 'completed', paid: true } };

export const PassageiroAvisouQuePagou: Story = { name: 'Passageiro avisou que pagou', args: { status: 'completed', reported: true } };

export const Cancelada: Story = { args: { status: 'cancelled' } };

export const EnderecosLongos: Story = { name: 'Endereços longos', args: { long: true, color: colors.cards[3] } };
