import type { Meta, StoryObj } from '@storybook/react-native';
import { StyleSheet, View } from 'react-native';
import { fn } from 'storybook/test';

import { colors, radius, spacing } from '../theme/tokens';

import { Button, IconButton, TextButton } from './Button';
import { Text } from './ui';

// Botão com texto. Médio é o padrão; pequeno só para ações secundárias.
const meta = {
  title: 'Componentes/Button',
  component: Button,
  args: {
    label: 'Estou a caminho',
    icon: 'directions_car',
    size: 'md',
    variant: 'ink',
    loading: false,
    disabled: false,
    destructive: false,
    onCard: false,
    onPress: fn(),
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    variant: { control: 'select', options: ['ink', 'light', 'accent', 'surface', 'ghost', 'danger'] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: 'Padrão', args: { variant: 'light' } };

export const SobreCartao: Story = {
  name: 'Sobre o cartão',
  args: { variant: 'ink', onCard: true },
  decorators: [
    (Story) => (
      <View style={[styles.card, { backgroundColor: colors.cards[0] }]}>
        <Story />
      </View>
    ),
  ],
};

export const Pequeno: Story = { args: { size: 'sm', variant: 'surface', label: 'Ver gastos', icon: 'receipt_long' } };

export const Carregando: Story = { args: { variant: 'light', loading: true } };

export const Desabilitado: Story = { args: { variant: 'light', disabled: true } };

export const Destrutivo: Story = { args: { variant: 'surface', destructive: true, label: 'Cancelar viagem', icon: 'close' } };

// Só para o que não tem volta, como excluir a conta.
export const Perigo: Story = { args: { variant: 'danger', label: 'Excluir conta', icon: 'delete_forever' } };

export const Variantes: Story = {
  render: (args) => (
    <View style={styles.column}>
      {(['light', 'accent', 'surface', 'ghost', 'danger'] as const).map((variant) => (
        <View key={variant} style={styles.row}>
          <Text variant="label" tone="secondary" style={styles.caption}>
            {variant}
          </Text>
          <Button {...args} variant={variant} />
          <Button {...args} variant={variant} size="sm" />
        </View>
      ))}
      <View style={[styles.card, { backgroundColor: colors.cards[1] }]}>
        <Text variant="label" tone="onCardMuted">
          ink
        </Text>
        <Button {...args} variant="ink" onCard />
        <Button {...args} variant="ghost" onCard size="sm" />
      </View>
    </View>
  ),
};

export const BotaoDeIcone: StoryObj<typeof IconButton> = {
  name: 'IconButton',
  render: () => (
    <View style={styles.column}>
      {(['surface', 'light', 'ink'] as const).map((variant) => (
        <View key={variant} style={[styles.inline, variant === 'ink' && [styles.card, { backgroundColor: colors.cards[2] }]]}>
          <IconButton name="chat" label="Conversas" variant={variant} onPress={fn()} />
          <IconButton name="chat" label="Conversas" variant={variant} badge={2} onPress={fn()} />
          <IconButton name="more_horiz" label="Opções" variant={variant} size="sm" onPress={fn()} />
          <IconButton name="map" label="Abrir no mapa" variant={variant} loading onPress={fn()} />
          <IconButton name="map" label="Abrir no mapa" variant={variant} disabled onPress={fn()} />
        </View>
      ))}
    </View>
  ),
};

export const BotaoDeTexto: StoryObj<typeof TextButton> = {
  name: 'TextButton',
  render: () => (
    <View style={styles.column}>
      <TextButton label="Entrar com Google" onPress={fn()} />
      <TextButton label="Ver sem conta" muted onPress={fn()} />
      <TextButton label="Entrando" loading onPress={fn()} />
      <TextButton label="Entrar com Google" disabled onPress={fn()} />
    </View>
  ),
};

const styles = StyleSheet.create({
  column: { gap: spacing[20] },
  row: { gap: spacing[8] },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  caption: { textTransform: 'uppercase' },
  card: { padding: spacing[20], gap: spacing[8], borderRadius: radius.card },
});
