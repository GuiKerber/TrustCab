import type { Meta, StoryObj } from '@storybook/react-native';
import { ScrollView } from 'react-native';
import { fn } from 'storybook/test';

import { sampleMonth, type Trip } from '@trustcab/core';
import { layout } from '../theme/tokens';

import { LONG_ADDRESSES } from '../storybook/storyData';
import { TripStack } from './TripStack';

// Pilha de cartões das viagens do dia. Tocar abre a viagem; segurar e arrastar para cima mostra o que está atrás
// e, puxando mais, abre a viagem. Arrastar sem segurar rola a tela.
const now = new Date();
const busiest = [...sampleMonth(now).days].sort((a, b) => b.trips.length - a.trips.length)[0]?.trips ?? [];
const withStatus = (trip: Trip, status: Trip['status']): Trip => ({ ...trip, status });

const meta = {
  title: 'Componentes/Cartões/TripStack',
  component: TripStack,
  tags: ['autodocs'],
  args: { trips: busiest.slice(0, 3), onOpen: fn() },
  render: (args) => (
    <ScrollView contentContainerStyle={{ paddingBottom: layout.scrollEnd }} showsVerticalScrollIndicator={false}>
      <TripStack {...args} />
    </ScrollView>
  ),
} satisfies Meta<typeof TripStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const UmaViagem: Story = { name: 'Uma viagem', args: { trips: busiest.slice(0, 1) } };

export const Andamentos: Story = {
  name: 'Andamentos',
  args: {
    trips: [
      withStatus(busiest[0], 'on_the_way'),
      withStatus({ ...busiest[1], id: 'b' }, 'arrived'),
      withStatus({ ...busiest[2], id: 'c' }, 'in_progress'),
      withStatus({ ...busiest[0], id: 'd' }, 'completed'),
      withStatus({ ...busiest[1], id: 'e' }, 'cancelled'),
    ],
  },
};

export const MuitasViagens: Story = {
  name: 'Mais de 6 viagens',
  args: { trips: Array.from({ length: 8 }, (_, i) => ({ ...busiest[i % busiest.length], id: `extra-${i}` })) },
};

// Endereços reais e longos: o cartão corta com reticências em vez de empurrar o horário ou o "Ver detalhes".
export const EnderecosLongos: Story = {
  name: 'Endereços longos',
  args: {
    trips: [
      { ...busiest[0], origin: LONG_ADDRESSES.hospital, destination: LONG_ADDRESSES.shopping },
      { ...busiest[1], id: 'long-2', origin: LONG_ADDRESSES.einstein, destination: LONG_ADDRESSES.airport },
      { ...busiest[2], id: 'long-3', origin: LONG_ADDRESSES.airport, destination: LONG_ADDRESSES.hospital },
    ],
  },
};
