import { Pressable, StyleSheet, View } from 'react-native';

import { messageTime, type Message } from '@trustcab/core';
import { colors, layout, opacity, radius, size, spacing } from '../theme/tokens';

import { focusRing, stateOpacity, useInteraction } from './Button';
import { Icon, Text } from './ui';

// Estado da sua mensagem: ícone + texto, nunca só a cor.
const STATUS = {
  sending: { icon: 'schedule', label: 'Enviando…' },
  sent: { icon: 'done', label: 'Enviada' },
  failed: { icon: 'error', label: 'Não enviada' },
} as const;

// Uma mensagem do chat. As suas à direita (claras), as do passageiro à esquerda, avisos no centro.
// Aviso automático da viagem (com notificação no celular do passageiro) aparece no centro, com o sino.
// "viewer": quem está lendo. As mensagens dele ficam à direita, com o estado de envio.
export function MessageBubble({
  message,
  now,
  viewer = 'driver',
  onRetry,
}: {
  message: Message;
  now: Date;
  viewer?: 'driver' | 'passenger';
  onRetry?: () => void;
}) {
  if (message.from === 'system') {
    return (
      <View style={styles.system} accessible accessibilityLabel={message.push ? `Aviso enviado: ${message.text}` : message.text}>
        {message.push ? <Icon name="notifications" size={size.icon.sm} color={colors.textSecondary} /> : null}
        <Text variant="small" tone="secondary" style={styles.systemText}>
          {message.text}
        </Text>
        {message.push && message.status === 'sending' ? (
          <Text variant="label" tone="secondary">
            {STATUS.sending.label}
          </Text>
        ) : null}
      </View>
    );
  }

  const mine = message.from === viewer;
  const status = mine && message.status ? STATUS[message.status] : null;
  const failed = message.status === 'failed';

  return (
    <View style={[styles.row, mine && styles.rowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs, message.status === 'sending' && styles.pending]}>
        <Text variant="body" tone={mine ? 'onCard' : 'text'} style={styles.text}>
          {message.text}
        </Text>
      </View>
      <View style={styles.meta}>
        <Text variant="label" tone="secondary">
          {messageTime(message.at, now)}
        </Text>
        {status ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <Icon name={status.icon} size={size.icon.sm} color={failed ? colors.orange : colors.textSecondary} />
            <Text variant="label" tone={failed ? 'orange' : 'secondary'}>
              {status.label}
            </Text>
          </View>
        ) : null}
      </View>
      {failed && onRetry ? <RetryButton onPress={onRetry} /> : null}
    </View>
  );
}

function RetryButton({ onPress }: { onPress: () => void }) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Tentar enviar de novo"
      style={({ pressed }) => [styles.retry, { opacity: stateOpacity({ pressed, hovered, disabled: false }) }, focused && focusRing()]}>
      <Icon name="refresh" size={size.icon.sm} color={colors.text} />
      <Text variant="small">Tentar de novo</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  system: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: spacing[6], paddingHorizontal: spacing[20] },
  systemText: { textAlign: 'center', flexShrink: 1 },
  row: { alignItems: 'flex-start', gap: spacing[4] },
  rowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: layout.bubbleMaxWidth, paddingHorizontal: spacing[16], paddingVertical: spacing[12], borderRadius: radius.block },
  bubbleMine: { backgroundColor: colors.text, borderBottomRightRadius: radius.joined },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: radius.joined },
  pending: { opacity: opacity.pending },
  // Palavra ou link sem espaço não estoura a bolha.
  text: { flexShrink: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  status: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  retry: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
    paddingHorizontal: spacing[12],
    borderRadius: radius.sm,
  },
});
