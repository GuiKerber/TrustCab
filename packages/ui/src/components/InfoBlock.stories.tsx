import type { Meta, StoryObj } from '@storybook/react-native';

import { InfoBlock } from './InfoBlock';
import { Text } from './ui';

// Bloco de informação sem ação: rótulo e o que ele explica.
const meta = {
  title: 'Componentes/Avisos/InfoBlock',
  component: InfoBlock,
  tags: ['autodocs'],
  args: {
    label: 'Quem vê',
    text: 'Só quem manda um pedido pelo seu link. O número não fica escrito na página, e ninguém consegue lê-lo só por abrir o endereço.',
  },
} satisfies Meta<typeof InfoBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Nota: Story = {};

// Como algo ficou depois de salvo.
export const Valor: Story = { args: { label: 'Salva', value: 'CPF · 123.456.789-00', text: undefined, live: true } };

export const ConteudoProprio: Story = {
  name: 'Conteúdo próprio (endereço do link)',
  args: {
    label: 'Seu endereço',
    text: 'Toque e segure para copiar.',
    children: (
      <Text variant="heading" selectable>
        trustcab-9bab6.web.app/a/carlos
      </Text>
    ),
  },
};
