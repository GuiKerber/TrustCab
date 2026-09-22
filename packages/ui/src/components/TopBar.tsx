import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../theme/tokens';

import { IconButton } from './Button';
import { OfflineNotice } from './OfflineNotice';
import { Text } from './ui';

// Topo de todas as abas: o nome da página à esquerda e o chat sempre à mão, no canto direito.
// Sem internet, a faixa de aviso aparece logo abaixo.
// Cada app passa o total de conversas não lidas e o que abrir ao tocar no chat.
export function TopBar({ title, unread = 0, onChat }: { title: string; unread?: number; onChat: () => void }) {
  return (
    <View style={styles.wrapper}>
    <View style={styles.bar}>
      <Text variant="bodyMedium" tone="secondary" accessibilityRole="header">
        {title}
      </Text>
      <IconButton name="chat" label="Conversas" badge={unread} onPress={onChat} />
    </View>
      <OfflineNotice />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[8] },
  bar: {
    minHeight: layout.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing[4],
  },
});
