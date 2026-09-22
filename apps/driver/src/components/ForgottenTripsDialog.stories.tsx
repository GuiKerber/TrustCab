import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { sampleMonth } from '@trustcab/core';

import { ForgottenTripsDialog, type ForgottenTrip } from './ForgottenTripsDialog';
import { LONG_ADDRESSES } from '@trustcab/ui/storybook';

// Ao abrir o app: viagens que passaram do horário e continuam abertas. Cada uma: "Concluída" ou "Não aconteceu".
const now = new Date();
const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
const trips = sampleMonth(now).days.flatMap((day) => day.trips).slice(0, 3);
const items: ForgottenTrip[] = trips.map((trip) => ({ date: yesterday, trip: { ...trip, status: 'scheduled' } }));

function Demo({ start }: { start: ForgottenTrip[] }) {
  const [list, setList] = useState(start);
  const resolve = (item: ForgottenTrip) => setList((current) => current.filter((entry) => entry.trip.id !== item.trip.id));
  return <ForgottenTripsDialog items={list} now={now} onComplete={resolve} onDidNotHappen={resolve} onLater={fn()} />;
}

const meta = {
  title: 'Motorista/ForgottenTripsDialog',
  component: Demo,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { start: items },
} satisfies Meta<typeof Demo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VariasViagens: Story = { name: 'Várias viagens' };

export const UmaViagem: Story = { name: 'Uma viagem', args: { start: items.slice(0, 1) } };

export const EnderecosLongos: Story = {
  name: 'Endereços longos',
  args: { start: [{ date: yesterday, trip: { ...trips[0], status: 'on_the_way', origin: LONG_ADDRESSES.einstein, destination: LONG_ADDRESSES.airport } }] },
};
