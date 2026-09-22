import type { Meta, StoryObj } from '@storybook/react-native';
import { ScrollView, StyleSheet } from 'react-native';
import { fn } from 'storybook/test';

import type { Message } from '@trustcab/core';
import { spacing } from '../theme/tokens';

import { MessageBubble } from './MessageBubble';
import { LONG_MESSAGES } from '../storybook/storyData';

// Mensagem do chat. Suas mensagens mostram o estado: enviando (sem internet), enviada ou não enviada, com "Tentar de novo".
// Avisos automáticos da viagem aparecem no centro, com o sino (viram notificação no celular do passageiro).
const now = new Date();
const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000);
const message = (partial: Partial<Message>): Message => ({ id: String(Math.random()), from: 'driver', text: 'Pode sim, passo 07:40.', at: at(5), ...partial });

const meta = {
  title: 'Componentes/Chat/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs'],
  args: { message: message({ status: 'sent' }), now, onRetry: fn() },
} satisfies Meta<typeof MessageBubble>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Enviada: Story = {};

export const Enviando: Story = { name: 'Enviando (sem internet)', args: { message: message({ status: 'sending' }) } };

export const NaoEnviada: Story = { name: 'Não enviada', args: { message: message({ status: 'failed' }) } };

export const DoPassageiro: Story = { name: 'Do passageiro', args: { message: message({ from: 'passenger', text: 'Obrigada! Hoje à noite continua às 18h?' }) } };

export const AvisoDaViagem: Story = {
  name: 'Aviso da viagem',
  args: {
    message: message({
      from: 'system',
      text: 'Carlos chegou em Rua das Flores, 120. Onix prata, placa FTR4E21.',
      push: { title: 'Carlos chegou', body: 'Onix prata, placa FTR4E21. Rua das Flores, 120.' },
      status: 'sent',
    }),
  },
};

export const AvisoDoApp: Story = { name: 'Aviso do app', args: { message: message({ from: 'system', text: 'Pedro aceitou seu convite e entrou na sua rede.' }) } };

// Teste de limite: parágrafo longo e link sem espaços não podem estourar a bolha.
export const MensagensLongas: Story = {
  name: 'Mensagens longas',
  render: () => (
    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      <MessageBubble message={message({ from: 'passenger', text: LONG_MESSAGES.paragraph, at: at(40) })} now={now} />
      <MessageBubble message={message({ text: LONG_MESSAGES.paragraph, status: 'sent' })} now={now} />
      <MessageBubble message={message({ from: 'passenger', text: LONG_MESSAGES.link, at: at(3) })} now={now} />
      <MessageBubble message={message({ text: LONG_MESSAGES.link, status: 'failed' })} now={now} onRetry={fn()} />
    </ScrollView>
  ),
};

const styles = StyleSheet.create({
  list: { gap: spacing[12] },
});
