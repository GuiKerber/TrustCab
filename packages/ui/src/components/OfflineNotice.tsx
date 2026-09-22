import { StyleSheet, View } from 'react-native';

import { useOnline } from '@trustcab/core';
import { colors, radius, size, spacing } from '../theme/tokens';

import { Icon, Text } from './ui';

// Faixa de "sem internet" no topo das telas. Some sozinha quando a conexão volta.
// O que você fizer offline (avisos, mensagens) fica "Enviando…" e sai assim que a internet voltar.
export function OfflineNotice({ force = false }: { force?: boolean }) {
  const online = useOnline();
  if (online && !force) return null;
  return (
    <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Icon name="wifi_off" size={size.icon.sm} color={colors.orange} />
      <Text variant="small" style={styles.text}>
        Sem internet. Avisos e mensagens saem assim que a conexão voltar.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  text: { flex: 1 },
});
