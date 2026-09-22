import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';

import { TextField } from './TextField';

// Campo de texto com rótulo fixo acima, texto de apoio e erro (com ícone, não só cor).
const meta = {
  title: 'Componentes/Formulário/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: {
    label: 'Placa',
    placeholder: 'ABC1D23',
    hint: 'Aparece no aviso "Cheguei".',
    value: '',
    autoCapitalize: 'characters',
    disabled: false,
  },
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof TextField>) {
  const [value, setValue] = useState(args.value ?? '');
  return <TextField {...args} value={value} onChangeText={setValue} />;
}

export const Vazio: Story = { render: (args) => <Interactive {...args} /> };

export const Preenchido: Story = { args: { value: 'FTR4E21' }, render: (args) => <Interactive {...args} /> };

export const Erro: Story = {
  args: { value: 'ABC', hint: undefined, error: 'A placa tem 7 caracteres, como ABC1D23. Confira e tente de novo.' },
  render: (args) => <Interactive {...args} />,
};

export const Desabilitado: Story = { args: { value: 'FTR4E21', disabled: true } };
