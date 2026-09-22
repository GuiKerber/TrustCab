import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet } from 'react-native';

import { colors, size, spacing } from '../theme/tokens';

import { FadeScroll } from './FadeScroll';
import { Text } from './ui';

// Área rolável sem barra de rolagem: um degradê na borda de baixo avisa que há mais conteúdo e some no fim.
const meta = {
  title: 'Componentes/Estrutura/FadeScroll',
  component: FadeScroll,
  tags: ['autodocs'],
  args: { background: colors.ground, children: null },
} satisfies Meta<typeof FadeScroll>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ComMaisConteudo: Story = {
  name: 'Com mais conteúdo',
  render: (args) => (
    <FadeScroll {...args} style={styles.box} contentContainerStyle={styles.content}>
      {Array.from({ length: 16 }, (_, i) => (
        <Text key={i} variant="body">{`Viagem ${i + 1} · 07:40 · Av. Paulista, 1000`}</Text>
      ))}
    </FadeScroll>
  ),
};

export const CabeInteiro: Story = {
  name: 'Cabe inteiro (sem degradê)',
  render: (args) => (
    <FadeScroll {...args} style={styles.box} contentContainerStyle={styles.content}>
      <Text variant="body">Viagem 1 · 07:40 · Av. Paulista, 1000</Text>
      <Text variant="body">Viagem 2 · 18:10 · Rua Augusta, 500</Text>
    </FadeScroll>
  ),
};

const styles = StyleSheet.create({
  box: { maxHeight: size.stack.card },
  content: { gap: spacing[8] },
});
