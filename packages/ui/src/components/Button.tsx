import type { AndroidSymbol } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { borderWidth, colors, opacity, radius, size as sizes, spacing } from '../theme/tokens';

import { Icon, Text } from './ui';

// O anel de foco só aparece quando quem navega usa o teclado (como o :focus-visible da web), não depois de um toque ou clique.
let usingKeyboard = false;
if (typeof document !== 'undefined') {
  document.addEventListener('keydown', () => (usingKeyboard = true), true);
  document.addEventListener('pointerdown', () => (usingKeyboard = false), true);
}

// Hover e foco de teclado. No celular só "pressionado" acontece; no navegador os quatro estados aparecem.
export function useInteraction() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return {
    hovered,
    focused,
    handlers: {
      onHoverIn: () => setHovered(true),
      onHoverOut: () => setHovered(false),
      onFocus: () => setFocused(usingKeyboard),
      onBlur: () => setFocused(false),
    },
  };
}

// Anel de foco visível, por fora do controle. "onCard" usa tinta, para aparecer sobre os cartões claros.
export function focusRing(onCard = false): ViewStyle {
  return {
    outlineWidth: borderWidth.strong,
    outlineStyle: 'solid',
    outlineColor: onCard ? colors.focusOnCard : colors.focusOnDark,
    outlineOffset: borderWidth.strong,
  };
}

export function stateOpacity({ pressed, hovered, disabled }: { pressed: boolean; hovered: boolean; disabled: boolean }) {
  if (disabled) return opacity.disabled;
  if (pressed) return opacity.pressed;
  if (hovered) return opacity.hover;
  return 1;
}

export type ButtonSize = 'sm' | 'md';
// danger: só para o que não tem volta, como excluir a conta.
export type ButtonVariant = 'ink' | 'light' | 'accent' | 'surface' | 'ghost' | 'danger';

function buttonPalette(variant: ButtonVariant, onCard: boolean, destructive: boolean) {
  const fg = destructive ? colors.orange : undefined;
  switch (variant) {
    case 'ink':
      return { bg: colors.ink, fg: fg ?? colors.text };
    case 'light':
      return { bg: colors.text, fg: fg ?? colors.ink };
    case 'accent':
      return { bg: colors.cards[0], fg: colors.ink };
    case 'surface':
      return { bg: colors.surface, fg: fg ?? colors.text };
    case 'ghost':
      return { bg: 'transparent', fg: fg ?? (onCard ? colors.ink : colors.text) };
    case 'danger':
      return { bg: colors.danger, fg: colors.ink };
  }
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: AndroidSymbol;
  // Médio é o padrão. Pequeno só para ações secundárias.
  size?: ButtonSize;
  variant?: ButtonVariant;
  // Enquanto a ação processa: mostra o indicador, bloqueia novos toques e avisa o leitor de tela.
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  // O botão está sobre um cartão claro (muda a cor do anel de foco e do texto do "ghost").
  onCard?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
};

// Botão com texto. Estados: padrão, hover, foco, pressionado, desabilitado e carregando.
export function Button({
  label,
  onPress,
  icon,
  size = 'md',
  variant = 'ink',
  loading = false,
  disabled = false,
  destructive = false,
  onCard = false,
  accessibilityHint,
  style,
}: ButtonProps) {
  const { hovered, focused, handlers } = useInteraction();
  const palette = buttonPalette(variant, onCard, destructive);
  const blocked = disabled || loading;

  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        size === 'sm' ? styles.buttonSm : styles.buttonMd,
        { backgroundColor: palette.bg, opacity: stateOpacity({ pressed, hovered, disabled }) },
        focused && focusRing(onCard),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Icon name={icon} size={size === 'sm' ? sizes.icon.sm : sizes.icon.md} color={palette.fg} />
      ) : null}
      <Text variant={size === 'sm' ? 'small' : 'bodyMedium'} style={[styles.label, { color: palette.fg }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export type IconButtonVariant = 'surface' | 'light' | 'ink';

const ICON_PALETTES: Record<IconButtonVariant, { bg: string; fg: string }> = {
  surface: { bg: colors.surface, fg: colors.text },
  light: { bg: colors.text, fg: colors.ink },
  ink: { bg: colors.ink, fg: colors.text },
};

// Botão redondo só com ícone. O pequeno é menor no desenho, mas a área de toque continua com 48.
export function IconButton({
  name,
  onPress,
  label,
  badge,
  variant = 'surface',
  size = 'md',
  loading = false,
  disabled = false,
  onCard = false,
}: {
  name: AndroidSymbol;
  onPress: () => void;
  label: string;
  badge?: number;
  variant?: IconButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onCard?: boolean;
}) {
  const { hovered, focused, handlers } = useInteraction();
  const palette = ICON_PALETTES[variant];
  const blocked = disabled || loading;
  const box = sizes.iconButton[size];

  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      accessibilityLabel={badge ? `${label}, ${badge} não lidas` : label}
      hitSlop={(sizes.touchTarget - box) / 2}
      style={({ pressed }) => [
        styles.iconButton,
        { width: box, height: box, borderRadius: box / 2, backgroundColor: palette.bg, opacity: stateOpacity({ pressed, hovered, disabled }) },
        focused && focusRing(onCard),
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <Icon name={name} size={size === 'sm' ? sizes.icon.sm : sizes.icon.lg} color={palette.fg} />
      )}
      {badge ? <View style={[styles.badge, { borderColor: palette.bg }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  buttonMd: { minHeight: sizes.button.md, borderRadius: sizes.button.md / 2, paddingHorizontal: spacing[20] },
  buttonSm: { minHeight: sizes.button.sm, borderRadius: sizes.button.sm / 2, paddingHorizontal: spacing[16] },
  label: { textAlign: 'center' },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: spacing[8],
    right: spacing[8],
    width: sizes.badge,
    height: sizes.badge,
    borderRadius: sizes.badge / 2,
    backgroundColor: colors.orange,
    borderWidth: borderWidth.strong,
  },
});

// Ação só com texto grande e seta, para telas editoriais (login). Mesmos estados do Button, incluindo carregando.
export function TextButton({
  label,
  onPress,
  icon = 'arrow_forward',
  muted = false,
  loading = false,
  disabled = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  icon?: AndroidSymbol;
  // Ação secundária: texto apagado.
  muted?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const { hovered, focused, handlers } = useInteraction();
  const blocked = disabled || loading;
  const color = muted ? colors.textSecondary : colors.text;

  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: blocked, busy: loading }}
      style={({ pressed }) => [
        textStyles.button,
        { opacity: stateOpacity({ pressed, hovered, disabled }) },
        focused && focusRing(),
      ]}>
      <Text variant="title" style={{ color }}>
        {label}
      </Text>
      {loading ? <ActivityIndicator size="small" color={color} /> : <Icon name={icon} size={sizes.icon.lg} color={color} />}
    </Pressable>
  );
}

const textStyles = StyleSheet.create({
  button: {
    minHeight: sizes.touchTarget,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    borderRadius: radius.sm,
  },
});
