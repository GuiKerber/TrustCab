import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { Checkbox } from './Checkbox';

// Caixa de seleção com texto. O estado marcado aparece no preenchimento e no ✓, não só na cor.
const meta = {
  title: 'Componentes/Formulário/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    label: 'Cancelar também as próximas',
    hint: 'As 12 viagens de Ana às 07:40 nos próximos 6 meses',
    checked: false,
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof Checkbox>) {
  const [checked, setChecked] = useState(args.checked);
  return (
    <Checkbox
      {...args}
      checked={checked}
      onChange={(next) => {
        setChecked(next);
        args.onChange(next);
      }}
    />
  );
}

export const Padrao: Story = { name: 'Padrão', render: (args) => <Interactive {...args} /> };

export const Marcado: Story = { args: { checked: true } };

export const SemApoio: Story = { name: 'Sem texto de apoio', args: { hint: undefined } };

export const Desabilitado: Story = { args: { disabled: true } };
