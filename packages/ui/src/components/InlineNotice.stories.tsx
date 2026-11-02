import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';

import { InlineNotice } from './InlineNotice';

// Linha curta de aviso perto do que ela explica: erro de campo, motivo de um bloqueio, o que fica de fora.
const meta = {
  title: 'Componentes/Avisos/InlineNotice',
  component: InlineNotice,
  tags: ['autodocs'],
  args: { text: 'Dá para escolher quais avisos receber depois, em Perfil → Configurações.' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'warning'] } },
} satisfies Meta<typeof InlineNotice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dica: Story = {};

export const Erro: Story = {
  args: { tone: 'warning', text: 'Não deu para salvar a resposta. Confira sua internet e tente de novo.' },
};

export const IconeProprio: Story = {
  name: 'Ícone próprio',
  args: { icon: 'check_circle', text: '2 viagens já pagas na hora ficam fora da cobrança.' },
};

export const SobreCartao: Story = {
  name: 'Sobre o cartão (folha da viagem)',
  args: { icon: 'schedule', onCard: true, text: 'Libera às 06:30, 1 hora antes da viagem.' },
  decorators: [
    (Story) => (
      <View style={styles.card}>
        <Story />
      </View>
    ),
  ],
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.cards[2], padding: spacing[20], borderRadius: radius.card },
});
