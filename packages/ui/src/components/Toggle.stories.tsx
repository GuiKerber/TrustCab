import type { Meta, StoryObj } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { fn } from 'storybook/test';


import { Toggle } from './Toggle';

// Liga/desliga com texto. O estado aparece na posição da bolinha, no trilho e escrito ("Ligado"/"Desligado").
const meta = {
  title: 'Componentes/Formulário/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  args: {
    label: 'Hora de sair',
    hint: 'Quando libera o "Estou a caminho", 1 hora antes da viagem.',
    value: true,
    disabled: false,
    onChange: fn(),
  },
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof meta>;

function Interactive(args: React.ComponentProps<typeof Toggle>) {
  const [value, setValue] = useState(args.value);
  return (
    <Toggle
      {...args}
      value={value}
      onChange={(next) => {
        setValue(next);
        args.onChange(next);
      }}
    />
  );
}

export const Ligado: Story = { render: (args) => <Interactive {...args} /> };

export const Desligado: Story = { args: { value: false }, render: (args) => <Interactive {...args} /> };

export const Desabilitado: Story = { args: { disabled: true } };

export const ListaDeNotificacoes: Story = {
  name: 'Lista de notificações',
  render: () => (
    <View>
      {[
        { title: 'Hora de sair', text: 'Quando libera o "Estou a caminho", 1 hora antes da viagem.' },
        { title: 'Pedidos de viagem', text: 'Quando um passageiro pede uma viagem para você aprovar.' },
        { title: 'Mensagens', text: 'Quando alguém escreve no chat.' },
      ].map((n) => (
        <Interactive key={n.title} label={n.title} hint={n.text} value onChange={fn()} />
      ))}
    </View>
  ),
};
