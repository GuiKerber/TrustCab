import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { sampleMonth, startOfDay } from '@trustcab/core';

import { spacing } from '../theme/tokens';

import { AgendaDay } from './AgendaDay';

// Um dia da lista da Agenda. O mesmo nos dois apps: o motorista vê passageiros; o passageiro, motoristas.
const now = new Date();
const busiest = [...sampleMonth(now).days].sort((a, b) => b.trips.length - a.trips.length)[0];

const meta = {
  title: 'Componentes/Agenda/AgendaDay',
  component: AgendaDay,
  tags: ['autodocs'],
  args: { date: busiest.date, trips: busiest.trips, today: now, selected: false, onOpen: fn() },
} satisfies Meta<typeof AgendaDay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ComViagens: Story = { name: 'Com viagens (motorista)' };

export const VistaDoPassageiro: Story = {
  name: 'Vista do passageiro',
  args: {
    trips: busiest.trips.map((trip, i) => ({ ...trip, driver: 'Carlos Mendes', status: i === 2 ? 'requested' : trip.status })),
    personOf: (trip) => trip.driver ?? 'Motorista',
  },
};

export const Escolhido: Story = { name: 'Dia escolhido', args: { selected: true } };

export const Hoje: Story = { args: { date: startOfDay(now) } };

export const SemViagens: Story = {
  name: 'Sem viagens',
  args: { trips: [] },
  decorators: [
    (Story) => (
      <View style={{ gap: spacing[8] }}>
        <Story />
      </View>
    ),
  ],
};
