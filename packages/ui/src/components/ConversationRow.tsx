import { Pressable, StyleSheet, View } from 'react-native';

import { messageTime, type Message } from '@trustcab/core';

import { colors, radius, size, spacing } from '../theme/tokens';

import { Avatar } from './Avatar';
import { focusRing, stateOpacity, useInteraction } from './Button';
import { Text } from './ui';

// Uma conversa na lista: avatar, nome, prévia da última mensagem e contador de não lidas (número + laranja).
export function ConversationRow({
  name,
  color,
  last,
  unread,
  now,
  first,
  lastRow,
  viewer = 'driver',
  onPress,
}: {
  name: string;
  color: string;
  last?: Message;
  unread: number;
  now: Date;
  first: boolean;
  lastRow: boolean;
  // Quem está lendo: a última mensagem dele aparece com "Você:".
  viewer?: 'driver' | 'passenger';
  onPress: () => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  const preview = last ? `${last.from === viewer ? 'Você: ' : ''}${last.text}` : 'Diga oi para começar a conversa.';

  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}${unread ? `, ${unread} ${unread === 1 ? 'mensagem nova' : 'mensagens novas'}` : ''}. ${preview}`}
      style={({ pressed }) => [
        styles.row,
        first && styles.rowFirst,
        lastRow && styles.rowLast,
        { opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        focused && focusRing(),
      ]}>
      <Avatar name={name} color={color} />
      <View style={styles.rowText}>
        <View style={styles.rowHead}>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.rowName}>
            {name}
          </Text>
          {last ? (
            <Text variant="small" tone={unread ? 'orange' : 'secondary'}>
              {messageTime(last.at, now)}
            </Text>
          ) : null}
        </View>
        <View style={styles.rowHead}>
          <Text variant="small" tone={unread ? 'text' : 'secondary'} numberOfLines={1} style={styles.rowName}>
            {preview}
          </Text>
          {unread ? (
            <View style={styles.badge}>
              <Text variant="label" tone="onCard">
                {String(unread)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.button.md + spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    backgroundColor: colors.surface,
    borderRadius: radius.joined,
  },
  rowFirst: { borderTopLeftRadius: radius.block, borderTopRightRadius: radius.block },
  rowLast: { borderBottomLeftRadius: radius.block, borderBottomRightRadius: radius.block },
  rowText: { flex: 1, gap: spacing[2] },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  rowName: { flex: 1 },
  badge: {
    minWidth: size.badgeCount,
    height: size.badgeCount,
    paddingHorizontal: spacing[6],
    borderRadius: size.badgeCount / 2,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
