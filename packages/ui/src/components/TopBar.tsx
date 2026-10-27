import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../theme/tokens';

import { IconButton } from './Button';
import { OfflineNotice } from './OfflineNotice';
import { Text } from './ui';

// Topo de todas as abas: o nome da página à esquerda e, no canto direito, a ação daquela página.
// Sem internet, a faixa de aviso aparece logo abaixo.
// "badge" conta o que está esperando resposta atrás da ação (ex.: pedidos novos).
export function TopBar({
  title,
  action,
}: {
  title: string;
  action?: { icon: AndroidSymbol; label: string; badge?: number; onPress: () => void };
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        <Text variant="bodyMedium" tone="secondary" accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.actions}>
          {action ? (
            <IconButton name={action.icon} label={action.label} badge={action.badge} variant="light" onPress={action.onPress} />
          ) : null}
        </View>
      </View>
      <OfflineNotice />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[8] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  bar: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing[4],
  },
});
