import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { fn } from 'storybook/test';

import { colors, spacing } from '../theme/tokens';

import { ConversationRow } from './ConversationRow';

// Uma conversa na lista de Conversas, igual nos dois apps. Não lidas: horário e contador em laranja, com o número.
const now = new Date();
const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);

const meta = {
  title: 'Componentes/Chat/ConversationRow',
  component: ConversationRow,
  tags: ['autodocs'],
  args: {
    name: 'Ana Souza',
    color: colors.cards[0],
    last: { id: '1', from: 'passenger', text: 'Obrigada! Hoje à noite continua às 18h?', at: at(40) },
    unread: 1,
    now,
    first: true,
    lastRow: true,
    onPress: fn(),
  },
} satisfies Meta<typeof ConversationRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NaoLida: Story = { name: 'Não lida' };

export const Lida: Story = { args: { unread: 0, last: { id: '2', from: 'driver', text: 'Pode sim, passo 07:40.', at: at(26 * 60) } } };

export const SemMensagens: Story = { name: 'Sem mensagens', args: { unread: 0, last: undefined } };

export const VistaDoPassageiro: Story = {
  name: 'Vista do passageiro',
  args: { name: 'Carlos Mendes', viewer: 'passenger', unread: 0, last: { id: '3', from: 'passenger', text: 'Estou descendo.', at: at(2) } },
};

export const Lista: Story = {
  render: (args) => (
    <View style={{ gap: spacing[2] }}>
      <ConversationRow {...args} first lastRow={false} />
      <ConversationRow {...args} name="Júlia Rocha" color={colors.cards[1]} unread={0} first={false} lastRow={false} />
      <ConversationRow {...args} name="Pedro Lima" color={colors.cards[2]} unread={3} first={false} lastRow />
    </View>
  ),
};
