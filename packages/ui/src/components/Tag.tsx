import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { colors, radius, size, spacing } from '../theme/tokens';

import { Icon, Label } from './ui';

export type TagTone = 'light' | 'muted';

// Etiqueta de estado (Ativo, Arquivado). Forma e ícone além da cor: quem não distingue cor precisa
// enxergar a diferença do mesmo jeito. "light" é o estado em vigor; "muted", o que saiu de cena.
export function Tag({ label, icon, tone = 'light' }: { label: string; icon?: AndroidSymbol; tone?: TagTone }) {
  const light = tone === 'light';
  return (
    <View style={[styles.tag, light ? styles.light : styles.muted]}>
      {icon ? <Icon name={icon} size={size.icon.sm} color={light ? colors.ink : colors.textSecondary} /> : null}
      <Label tone={light ? 'onCard' : 'secondary'}>{label}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[8],
    borderRadius: radius.sm,
  },
  light: { backgroundColor: colors.text },
  muted: { backgroundColor: colors.surfaceRaised },
});
