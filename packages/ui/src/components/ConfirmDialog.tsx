import type { AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, radius, spacing } from '../theme/tokens';

import { Button, type ButtonVariant } from './Button';
import { Handle, Text } from './ui';

// Confirmação que sobe do rodapé: pergunta, o que acontece e duas saídas. "Voltar" sempre existe.
// "inline" desenha por cima de outra camada (ex.: a folha da viagem), sem abrir um segundo modal.
export function ConfirmDialog({
  visible,
  title,
  text,
  confirmLabel,
  confirmIcon,
  confirmVariant = 'surface',
  destructive = false,
  loading = false,
  cancelLabel = 'Voltar',
  error,
  children,
  onConfirm,
  onClose,
  inline = false,
}: {
  visible: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  confirmIcon?: AndroidSymbol;
  confirmVariant?: ButtonVariant;
  destructive?: boolean;
  loading?: boolean;
  cancelLabel?: string;
  // O que deu errado ao confirmar e o que fazer.
  error?: string | null;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  inline?: boolean;
}) {
  const insets = useSafeAreaInsets();

  const content = (
    <View style={styles.layer}>
      <Pressable style={styles.scrim} onPress={loading ? undefined : onClose} accessibilityLabel={cancelLabel} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16] }]} accessibilityViewIsModal>
        <Handle />
        <View style={styles.head}>
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="body" tone="secondary">
            {text}
          </Text>
        </View>
        {children}
        {error ? (
          <Text variant="small" tone="orange" accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button label={confirmLabel} icon={confirmIcon} variant={confirmVariant} destructive={destructive} loading={loading} onPress={onConfirm} />
          <Button label={cancelLabel} size="sm" variant="ghost" disabled={loading} onPress={onClose} style={styles.center} />
        </View>
      </View>
    </View>
  );

  if (inline) return visible ? content : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={loading ? undefined : onClose} statusBarTranslucent>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.ground,
    borderTopLeftRadius: radius.block,
    borderTopRightRadius: radius.block,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[12],
    gap: spacing[20],
  },
  head: { gap: spacing[8], paddingHorizontal: spacing[4] },
  error: { paddingHorizontal: spacing[4] },
  actions: { gap: spacing[8] },
  center: { alignSelf: 'center' },
});
