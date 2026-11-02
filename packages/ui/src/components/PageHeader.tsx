import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../theme/tokens';

import { Text } from './ui';

// Título editorial de página: o assunto em claro e, se houver, o complemento apagado na linha de
// baixo ("Seu link" / "de agenda"). Embaixo, duas formas de texto de apoio, que podem vir juntas:
// - "meta": quem ou o quê, colado ao título (e-mail da conta, telefone do passageiro);
// - "lead": a frase que explica a tela, com respiro.
// "above" fica acima do título (ex.: a etiqueta Ativo/Arquivado). Palavra comprida que quebraria no
// meio em celular estreito ("Configurações") usa size="displaySm".
export function PageHeader({
  title,
  subtitle,
  meta,
  lead,
  above,
  size = 'display',
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  lead?: string;
  above?: ReactNode;
  size?: 'display' | 'displaySm';
}) {
  return (
    <View style={styles.wrapper}>
      {above}
      <View>
        <Text variant={size} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant={size} tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {meta ? (
        <Text variant="body" tone="secondary">
          {meta}
        </Text>
      ) : null}
      {lead ? (
        <Text variant="body" tone="secondary" style={styles.lead}>
          {lead}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[4], paddingHorizontal: layout.textInset },
  // gap 4 + 8 = os 12 de respiro entre o título e a frase.
  lead: { marginTop: spacing[8] },
});
