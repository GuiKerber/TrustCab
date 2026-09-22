import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { ROUTE_STEPS, RouteMap, RouteNode } from './Route';
import { Text } from './ui';

// Ilustração do percurso na folha da viagem: a seta anda pela rua conforme o andamento.
const meta = {
  title: 'Componentes/Viagem/Route',
  component: RouteMap,
  tags: ['autodocs'],
  args: { progress: 'location', tone: 'onCard', cardColor: colors.cards[0] },
  argTypes: {
    progress: { control: 'select', options: ROUTE_STEPS },
    tone: { control: 'inline-radio', options: ['onCard', 'onDark'] },
    cardColor: { control: 'select', options: [...colors.cards, colors.cardDone] },
  },
  render: (args) => (
    <View style={[styles.card, { backgroundColor: args.cardColor }]}>
      <RouteMap {...args} />
    </View>
  ),
} satisfies Meta<typeof RouteMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const EmViagem: Story = { name: 'Em viagem', args: { progress: 'toDestination', cardColor: colors.cards[2] } };

export const Encerrada: Story = { args: { progress: 'destination', tone: 'onDark', cardColor: colors.cardDone } };

export const Etapas: Story = {
  render: () => (
    <View style={styles.row}>
      {ROUTE_STEPS.map((step, i) => (
        <View key={step} style={styles.step}>
          <View style={[styles.card, { backgroundColor: colors.cards[i] }]}>
            <RouteMap progress={step} tone="onCard" cardColor={colors.cards[i]} />
          </View>
          <Text variant="small" tone="secondary">
            {step}
          </Text>
        </View>
      ))}
    </View>
  ),
};

export const Pontos: StoryObj<typeof RouteNode> = {
  name: 'RouteNode',
  render: () => (
    <View style={styles.row}>
      <View style={[styles.nodeBox, { backgroundColor: colors.cards[0] }]}>
        <RouteNode reached={false} tone="onCard" background={colors.cards[0]} />
        <RouteNode reached tone="onCard" background={colors.cards[0]} />
      </View>
      <View style={[styles.nodeBox, { backgroundColor: colors.cardDone }]}>
        <RouteNode reached={false} tone="onDark" background={colors.cardDone} />
        <RouteNode reached tone="onDark" background={colors.cardDone} />
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  card: { height: size.stack.card + size.stack.peek, padding: spacing[20], borderRadius: radius.card, alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[12] },
  step: { gap: spacing[6], alignItems: 'center' },
  nodeBox: { flexDirection: 'row', gap: spacing[16], padding: spacing[20], borderRadius: radius.block },
});
