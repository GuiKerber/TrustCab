import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { sampleMonth, startOfDay } from '@trustcab/core';

import { DaySlider } from './DaySlider';

// Faixa de dias da home. O dia escolhido ganha pílula clara; dia com viagem tem um ponto laranja.
const now = new Date();
const days = sampleMonth(now).days.filter((day) => day.date >= startOfDay(now));

const meta = {
  title: 'Componentes/Seleção/DaySlider',
  component: DaySlider,
  tags: ['autodocs'],
  args: { days, selected: startOfDay(now), today: now, onSelect: fn() },
} satisfies Meta<typeof DaySlider>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof DaySlider>) {
  const [selected, setSelected] = useState(args.selected);
  return (
    <DaySlider
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
