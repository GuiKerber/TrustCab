import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { sampleMonth, startOfDay } from '@trustcab/core';
import { size, spacing } from '../theme/tokens';

import { MonthGrid, TripDots } from './MonthGrid';
import { Text } from './ui';

// Mês da agenda: cada dia mostra uma bolinha por viagem, na cor do cartão. Hoje tem borda laranja; o escolhido, borda clara.
const now = new Date();
const days = sampleMonth(now).days;

const meta = {
  title: 'Componentes/Seleção/MonthGrid',
  component: MonthGrid,
  tags: ['autodocs'],
  args: { days, selected: startOfDay(now), today: now, onSelect: fn() },
} satisfies Meta<typeof MonthGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof MonthGrid>) {
  const [selected, setSelected] = useState(args.selected);
  return (
    <MonthGrid
      {...args}
      selected={selected}
      onSelect={(date) => {
        setSelected(date);
        args.onSelect(date);
      }}
    />
  );
}

export const Padrao: Story = { name: 'Padrão', render: (args) => <Interactive {...args} /> };

export const SemSelecao: Story = { name: 'Sem dia escolhido', args: { selected: null } };

export const Bolinhas: StoryObj<typeof TripDots> = {
  name: 'TripDots',
  render: () => {
    const busy = [...days].sort((a, b) => b.trips.length - a.trips.length)[0]?.trips ?? [];
    return (
      <View style={styles.column}>
        <Text variant="small" tone="secondary">
          Uma bolinha por viagem, até 4; depois, "+n".
        </Text>
        <TripDots trips={busy.slice(0, 1)} />
        <TripDots trips={busy.slice(0, 3)} />
        <TripDots trips={busy} dot={size.dot.md} />
      </View>
    );
  },
};

const styles = StyleSheet.create({
  column: { gap: spacing[12] },
});
