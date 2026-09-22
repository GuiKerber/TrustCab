import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { ChipGroup } from './ChipGroup';

// Várias opções ao mesmo tempo, como os dias da semana de uma rotina. Marcada = clara e com ✓.
const WEEKDAYS = [
  { key: '1', label: 'Seg', accessibilityLabel: 'Segunda' },
  { key: '2', label: 'Ter', accessibilityLabel: 'Terça' },
  { key: '3', label: 'Qua', accessibilityLabel: 'Quarta' },
  { key: '4', label: 'Qui', accessibilityLabel: 'Quinta' },
  { key: '5', label: 'Sex', accessibilityLabel: 'Sexta' },
  { key: '6', label: 'Sáb', accessibilityLabel: 'Sábado' },
  { key: '0', label: 'Dom', accessibilityLabel: 'Domingo' },
];

const meta = {
  title: 'Componentes/Seleção/ChipGroup',
  component: ChipGroup,
  tags: ['autodocs'],
  args: { items: WEEKDAYS, selected: ['1', '3', '5'], onChange: fn(), accessibilityLabel: 'Dias da semana' },
} satisfies Meta<typeof ChipGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof ChipGroup>) {
  const [selected, setSelected] = useState(args.selected);
  return (
    <ChipGroup
      {...args}
      selected={selected}
      onChange={(next) => {
        setSelected(next);
        args.onChange(next);
      }}
    />
  );
}

export const DiasDaSemana: Story = { name: 'Dias da semana', render: (args) => <Interactive {...args} /> };

export const Vazio: Story = { args: { selected: [] }, render: (args) => <Interactive {...args} /> };

export const Erro: Story = { args: { selected: [], error: 'Escolha pelo menos um dia da semana.' }, render: (args) => <Interactive {...args} /> };
