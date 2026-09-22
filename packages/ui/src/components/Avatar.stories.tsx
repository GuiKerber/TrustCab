import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme/tokens';

import { Avatar } from './Avatar';

// Inicial do passageiro no círculo com a cor dele. Decorativo: o nome sempre aparece ao lado.
const meta = {
  title: 'Componentes/Lista/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Ana Souza', color: colors.cards[0] },
  argTypes: { color: { control: 'select', options: colors.cards } },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão' };

export const Cores: Story = {
  render: () => (
    <View style={styles.row}>
      {['Ana', 'Júlia', 'Pedro', 'Marina', 'Rafael'].map((name, i) => (
        <Avatar key={name} name={name} color={colors.cards[i]} />
      ))}
    </View>
  ),
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing[8] },
});
