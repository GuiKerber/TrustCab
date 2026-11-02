import { StyleSheet, View } from 'react-native';

import { borderWidth, colors, layout, radius, size, spacing } from '../theme/tokens';

import { Label, Text } from './ui';

// Cartão de total (página do passageiro). Mesma tipografia em todas as cores: título no topo,
// respiro, o número principal e, embaixo de um traço, o número secundário com o rótulo dele.
// "wide" ganha mais largura ao lado de outro: valor em reais tem mais dígitos que uma contagem.
export function StatCard({
  color,
  title,
  value,
  detailLabel,
  detail,
  wide = false,
}: {
  color: string;
  title: string;
  value: string;
  detailLabel: string;
  detail: string;
  wide?: boolean;
}) {
  return (
    <View
      style={[styles.stat, wide && styles.wide, { backgroundColor: color }]}
      accessible
      accessibilityLabel={`${title}: ${value}. ${detailLabel}: ${detail}`}>
      <Label tone="onCardMuted">{title}</Label>
      <View style={styles.bottom}>
        <Text variant="displaySm" tone="onCard" numberOfLines={1}>
          {value}
        </Text>
        <View style={styles.detail}>
          <Text variant="small" tone="onCardMuted">
            {detailLabel}
          </Text>
          <Text variant="bodyMedium" tone="onCard">
            {detail}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    minHeight: size.statCardMinHeight,
    borderRadius: radius.block,
    padding: spacing[16],
    justifyContent: 'space-between',
    gap: spacing[28],
  },
  wide: { flex: layout.statWideFlex },
  bottom: { gap: spacing[12] },
  detail: {
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.inkLine,
    paddingTop: spacing[8],
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
});
