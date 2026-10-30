import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { spacing } from '../theme/tokens';

import { Block, Label, Text } from './ui';

// Bloco de informação sem ação: um rótulo e o que ele explica. Serve para a nota ao pé de um
// formulário ("Quem vê", "Por que isso importa") e para mostrar como algo ficou ("Salva",
// "Assim aparece no aviso").
// - "value": o dado em si, em destaque (a chave salva, o endereço do link);
// - "text": a explicação, pequena e apagada;
// - "children": o que mais precisar (um endereço selecionável, uma linha extra).
// "live" anuncia a mudança do valor ao leitor de tela (ex.: a chave acabou de ser salva).
export function InfoBlock({
  label,
  value,
  text,
  live = false,
  children,
}: {
  label: string;
  value?: string;
  text?: string;
  live?: boolean;
  children?: ReactNode;
}) {
  return (
    <Block style={styles.block}>
      <Label>{label}</Label>
      {value ? (
        <Text variant="bodyMedium" accessibilityLiveRegion={live ? 'polite' : undefined}>
          {value}
        </Text>
      ) : null}
      {children}
      {text ? (
        <Text variant="small" tone="secondary">
          {text}
        </Text>
      ) : null}
    </Block>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing[4] },
});
