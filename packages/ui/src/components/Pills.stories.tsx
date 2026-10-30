import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Pills } from './Pills';

// Abas em pílula, fundidas ao fundo: só a escolhida fica clara. Rola na horizontal quando não cabem.
const meta = {
  title: 'Componentes/Seleção/Pills',
  component: Pills,
  tags: ['autodocs'],
  args: {
    items: [
      { key: 'active', label: 'Ativos' },
      { key: 'archived', label: 'Arquivados' },
    ],
    selected: 'active',
    onSelect: fn(),
    accessibilityLabel: 'Passageiros',
  },
} satisfies Meta<typeof Pills>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof Pills>) {
  const [selected, setSelected] = useState(args.selected);
  return (
    <Pills
      {...args}
      selected={selected}
      onSelect={(key) => {
        setSelected(key);
        args.onSelect(key);
      }}
    />
  );
}

export const Padrao: Story = { name: 'Padrão', render: (args) => <Interactive {...args} /> };

export const Meses: Story = {
  args: {
    items: ['Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro'].map((label) => ({ key: label, label })),
    selected: 'Setembro',
    accessibilityLabel: 'Mês',
  },
  render: (args) => <Interactive {...args} />,
};

// Resposta de formulário (Horários, chave Pix): mesmo desenho, mas o leitor de tela anuncia opções, não abas.
export const Formulario: Story = {
  name: 'Formulário (radio)',
  args: {
    items: [
      { key: '15', label: '15 min' },
      { key: '30', label: '30 min' },
      { key: '60', label: '1 hora' },
    ],
    selected: '30',
    role: 'radio',
    accessibilityLabel: 'Intervalo entre os horários',
  },
  render: (args) => <Interactive {...args} />,
};
