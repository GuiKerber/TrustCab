import type { Meta, StoryObj } from '@storybook/react-native';
import { fn } from 'storybook/test';

import type { Message } from '@trustcab/core';

import { LONG_MESSAGES } from '../storybook/storyData';
import { colors } from '../theme/tokens';

import { ChatScreen } from './ChatScreen';

// A conversa inteira, igual nos dois apps. "viewer" diz de que lado a pessoa está lendo.
const now = new Date();
const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);
const messages: Message[] = [
  { id: '1', from: 'passenger', text: 'Oi, Carlos! Amanhã posso sair 10 min mais tarde?', at: at(26 * 60), status: 'sent' },
  { id: '2', from: 'driver', text: 'Pode sim, passo 07:40.', at: at(26 * 60 - 5), status: 'sent' },
  { id: '3', from: 'system', text: 'Carlos está a caminho da partida (Rua das Flores, 120).', at: at(12), push: { title: 'Carlos está a caminho', body: 'Viagem das 07:40.' } },
  { id: '4', from: 'system', text: 'Carlos chegou em Rua das Flores, 120. Onix prata, placa FTR4E21.', at: at(2), push: { title: 'Carlos chegou', body: 'Onix prata.' } },
  { id: '5', from: 'passenger', text: 'Estou descendo.', at: at(1), status: 'sending' },
];

const meta = {
  title: 'Telas/ChatScreen',
  component: ChatScreen,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { name: 'Carlos Mendes', color: colors.cards[0], messages, now, viewer: 'passenger', onBack: fn(), onCall: fn(), onSend: fn(), onRetry: fn() },
} satisfies Meta<typeof ChatScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Passageiro: Story = {};

export const Motorista: Story = { args: { name: 'Ana Souza', viewer: 'driver' } };

export const Vazia: Story = { args: { messages: [] } };

export const Encerrada: Story = { args: { closedText: 'Você saiu da rede de Carlos. O histórico continua aqui, mas não dá para mandar mensagens.', onCall: undefined } };

export const MensagensLongas: Story = {
  name: 'Mensagens longas',
  args: {
    messages: [
      { id: 'a', from: 'driver', text: LONG_MESSAGES.paragraph, at: at(30), status: 'sent' },
      { id: 'b', from: 'passenger', text: LONG_MESSAGES.link, at: at(20), status: 'failed' },
    ],
  },
};
