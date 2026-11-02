import type { AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../theme/tokens';

import { Button, type ButtonVariant } from './Button';
import { InlineNotice } from './InlineNotice';
import { Sheet } from './Sheet';
import { Text } from './ui';

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
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={cancelLabel} dismissible={!loading} inline={inline}>
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
        <View style={styles.error}>
          <InlineNotice tone="warning" text={error} />
        </View>
      ) : null}
      <View style={styles.actions}>
        <Button label={confirmLabel} icon={confirmIcon} variant={confirmVariant} destructive={destructive} loading={loading} onPress={onConfirm} />
        <Button label={cancelLabel} size="sm" variant="ghost" disabled={loading} onPress={onClose} style={styles.center} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[8], paddingHorizontal: layout.textInset },
  error: { paddingHorizontal: layout.textInset },
  actions: { gap: spacing[8] },
  center: { alignSelf: 'center' },
});
