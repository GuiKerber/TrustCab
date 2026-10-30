import type { AndroidSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { colors, size, spacing } from '../theme/tokens';

import { Icon, Text, type Tone } from './ui';

export type InlineNoticeTone = 'neutral' | 'warning';

// Linha curta de aviso: ícone + texto, perto do que ela explica. É o erro de um campo, o motivo de
// um botão estar bloqueado, o que fica fora de uma cobrança.
//
// "warning" é o erro: o que houve e o que fazer, em laranja e com ícone (o estado nunca depende só
// da cor), anunciado pelo leitor de tela assim que aparece. "neutral" é a dica, em cinza.
// "onCard" é a versão para cima dos cartões claros; lá o laranja não tem contraste, então só existe a dica.
export function InlineNotice({
  text,
  icon,
  tone = 'neutral',
  onCard = false,
}: {
  text: string;
  icon?: AndroidSymbol;
  tone?: InlineNoticeTone;
  onCard?: boolean;
}) {
  const warning = tone === 'warning' && !onCard;
  const textTone: Tone = warning ? 'orange' : onCard ? 'onCardMuted' : 'secondary';
  const iconColor = warning ? colors.orange : onCard ? colors.inkSecondary : colors.textSecondary;

  return (
    <View style={styles.row} accessibilityLiveRegion={warning ? 'polite' : undefined}>
      <Icon name={icon ?? (warning ? 'error' : 'info')} size={size.icon.sm} color={iconColor} />
      <Text variant="small" tone={textTone} style={styles.text}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // O ícone acompanha a primeira linha quando o texto quebra.
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[8] },
  text: { flex: 1 },
});
