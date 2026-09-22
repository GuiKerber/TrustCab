import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { colors, radius, size, spacing, type } from '../theme/tokens';

import { Block, Handle, Icon, Label, Text } from './ui';

// Peças de base: todo texto do app passa por <Text>, com um estilo de tipografia (variant) e um tom.
const meta = {
  title: 'Componentes/Base/Text',
  component: Text,
  tags: ['autodocs'],
  args: { children: 'Dirija para quem você conhece.', variant: 'body', tone: 'text' },
  argTypes: {
    variant: { control: 'select', options: Object.keys(type) },
    tone: { control: 'select', options: ['text', 'secondary', 'onCard', 'onCardMuted', 'orange'] },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const Tons: Story = {
  render: () => (
    <View style={styles.column}>
      <Text tone="text">text · sobre o fundo escuro</Text>
      <Text tone="secondary">secondary · apoio</Text>
      <Text tone="orange">orange · não lido, hoje, destrutivo</Text>
      <View style={[styles.card, { backgroundColor: colors.cards[0] }]}>
        <Text tone="onCard">onCard · sobre o cartão</Text>
        <Text tone="onCardMuted">onCardMuted · apoio no cartão</Text>
      </View>
    </View>
  ),
};

export const Rotulo: Story = {
  name: 'Label',
  render: () => (
    <View style={styles.column}>
      <Label>Próxima viagem</Label>
      <Label tone="orange">Hoje</Label>
    </View>
  ),
};

export const Icones: Story = {
  name: 'Icon',
  render: () => (
    <View style={styles.row}>
      <Icon name="home" size={size.icon.sm} />
      <Icon name="calendar_month" size={size.icon.md} />
      <Icon name="directions_car" size={size.icon.lg} />
      <Icon name="payments" size={size.icon.xl} color={colors.textSecondary} />
      <Icon name="qr_code_2" size={size.icon['2xl']} color={colors.cards[0]} />
    </View>
  ),
};

export const Bloco: Story = {
  name: 'Block',
  render: () => (
    <View style={styles.column}>
      <Block>
        <Text variant="bodyMedium">Superfície padrão</Text>
        <Text variant="small" tone="secondary">
          Para agrupar informação sobre o fundo escuro.
        </Text>
      </Block>
      <Block onPress={fn()} accessibilityLabel="Bloco que abre algo">
        <Text variant="bodyMedium">Bloco tocável</Text>
        <Text variant="small" tone="secondary">
          Escurece ao pressionar.
        </Text>
      </Block>
      <Block background={colors.surfaceRaised}>
        <Text variant="bodyMedium">Superfície elevada</Text>
      </Block>
    </View>
  ),
};

export const Alca: Story = {
  name: 'Handle',
  render: () => (
    <View style={styles.column}>
      <Handle />
      <View style={[styles.card, { backgroundColor: colors.cards[2] }]}>
        <Handle color={colors.inkLine} />
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  column: { gap: spacing[16] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[16] },
  card: { padding: spacing[20], gap: spacing[4], borderRadius: radius.card },
});
