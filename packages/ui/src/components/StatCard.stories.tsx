import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { colors, layout } from '../theme/tokens';

import { StatCard } from './StatCard';

// Cartão de total da página do passageiro: mesma tipografia em todas as cores.
const meta = {
  title: 'Componentes/Cartões/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  args: { color: colors.cards[0], title: 'Viagens concluídas', value: '97', detailLabel: 'Outubro', detail: '40' },
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Contagem: Story = {};

// Sem viagem no mês: o secundário vira um traço, nunca some.
export const SemDetalhe: Story = { name: 'Sem viagens no mês', args: { value: '0', detail: '—' } };

// Como aparece na página: o de valor em reais é mais largo.
export const Par: Story = {
  render: () => (
    <View style={styles.row}>
      <StatCard color={colors.cards[0]} title="Viagens concluídas" value="97" detailLabel="Outubro" detail="40" />
      <StatCard color={colors.cards[1]} title="Custo total" value="R$ 2.425" detailLabel="Ticket médio" detail="R$ 25,00" wide />
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: layout.gap },
});
