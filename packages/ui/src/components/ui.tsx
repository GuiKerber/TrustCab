import { SymbolView, type AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type ColorValue,
  type TextProps as RNTextProps,
  type ViewStyle,
} from 'react-native';

import { colors, maxFontScale, opacity, radius, size, spacing, type } from '../theme/tokens';

// "text*" = sobre o fundo escuro; "onCard*" = sobre os cartões claros.
export type Tone = 'text' | 'secondary' | 'onCard' | 'onCardMuted' | 'orange';

const tones: Record<Tone, string> = {
  text: colors.text,
  secondary: colors.textSecondary,
  onCard: colors.ink,
  onCardMuted: colors.inkSecondary,
  orange: colors.orange,
};

export type TextProps = RNTextProps & { variant?: keyof typeof type; tone?: Tone };

const DISPLAY_VARIANTS: (keyof typeof type)[] = ['hero', 'display', 'displaySm', 'title'];

export function Text({ variant = 'body', tone = 'text', style, ...rest }: TextProps) {
  return (
    <RNText
      maxFontSizeMultiplier={DISPLAY_VARIANTS.includes(variant) ? maxFontScale.display : undefined}
      {...rest}
      style={[type[variant], { color: tones[tone] }, style]}
    />
  );
}

export function Label({ children, tone = 'secondary' }: { children: string; tone?: Tone }) {
  return (
    <Text variant="label" tone={tone} style={styles.label}>
      {children.toUpperCase()}
    </Text>
  );
}

export function Icon({ name, size: iconSize = size.icon.lg, color = colors.text }: { name: AndroidSymbol; size?: number; color?: ColorValue }) {
  return (
    <SymbolView
      name={{ android: name, web: name }}
      size={iconSize}
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

type BlockProps = {
  children: ReactNode;
  background?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
  padded?: boolean;
};

// Superfície escura com cantos arredondados.
export function Block({ children, background = colors.surface, onPress, accessibilityLabel, style, padded = true }: BlockProps) {
  const shape: ViewStyle = { backgroundColor: background, borderRadius: radius.block };

  if (!onPress) {
    return <View style={[styles.block, padded && styles.blockPadded, shape, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.block, padded && styles.blockPadded, shape, style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

// Alça no topo das folhas que sobem do rodapé.
export function Handle({ color = colors.line }: { color?: string }) {
  return <View style={[styles.handle, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  label: { textTransform: 'uppercase' },
  block: { overflow: 'hidden' },
  blockPadded: { padding: spacing[20] },
  pressed: { opacity: opacity.pressed },
  handle: { alignSelf: 'center', width: size.handle.width, height: size.handle.height, borderRadius: radius.xs },
});
