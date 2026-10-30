import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './ui';

// Folha que sobe do rodapé: base do ConfirmDialog, do TripOptions e das prévias do app.
const meta = {
  title: 'Componentes/Camadas/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    visible: true,
    inline: true,
    closeLabel: 'Fechar',
    onClose: fn(),
    children: (
      <>
        <Text variant="title">Cobrança de outubro</Text>
        <Text variant="body" tone="secondary">
          Tudo o que a folha precisa mostrar fica aqui dentro. A alça, os cantos e o respiro do rodapé vêm prontos.
        </Text>
        <Button label="Abrir o WhatsApp de Ana" icon="chat" variant="light" onPress={fn()} />
      </>
    ),
  },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

// Enquanto algo processa, tocar fora não fecha.
export const Bloqueada: Story = { args: { dismissible: false } };

// Conteúdo maior que a tela: a folha para em 88% da altura.
export const ConteudoLongo: Story = {
  name: 'Conteúdo longo',
  args: {
    children: (
      <>
        {Array.from({ length: 30 }, (_, i) => (
          <Text key={i} variant="body">{`Linha ${i + 1}`}</Text>
        ))}
      </>
    ),
  },
};
