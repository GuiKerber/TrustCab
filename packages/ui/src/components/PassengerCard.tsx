import { StyleSheet, View } from 'react-native';

import { formatPriceShort } from '@trustcab/core';
import { borderWidth, colors, radius, size, spacing } from '../theme/tokens';

import { Icon, Label, Text } from './ui';

type PassengerCardContentProps = {
  name: string;
  dark: boolean;
  // Linha abaixo do nome: "30 viagens" nos ativos, "Convite enviado · ontem" nos pendentes.
  subtitle: string;
  // Ativos: total do mês atual, à direita, com o rótulo do mês junto do valor.
  month?: { label: string; totalCents: number };
};

// Conteúdo do cartão de passageiro dentro da pilha (CardStack).
// Topo: nome e viagens à esquerda, total do mês à direita. Respiro. Base: "Ver detalhes".
// Ativos e pendentes usam exatamente a mesma tipografia; só a cor do cartão muda.
export function PassengerCardContent({ name, dark, subtitle, month }: PassengerCardContentProps) {
  const tone = dark ? 'text' : 'onCard';
  const muted = dark ? 'secondary' : 'onCardMuted';

  return (
    <>
      <View style={styles.head}>
        <View style={styles.who}>
          <Text variant="heading" tone={tone} numberOfLines={1}>
            {name}
          </Text>
          <Text variant="small" tone={muted} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {month ? (
          <View style={styles.total}>
            <Label tone={muted}>{month.label}</Label>
            <Text variant="displaySm" tone={tone}>
              {formatPriceShort(month.totalCents)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.foot, { borderTopColor: dark ? colors.lineStrong : colors.inkLine }]}>
        <Text variant="bodyMedium" tone={tone}>
          Ver detalhes
        </Text>
        <View style={[styles.arrow, { backgroundColor: dark ? colors.surfaceRaised : colors.ink }]}>
          <Icon name="north_east" size={size.icon.sm} color={colors.text} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[12] },
  who: { flex: 1, gap: spacing[2], paddingTop: spacing[4] },
  total: { alignItems: 'flex-end', gap: spacing[2] },
  foot: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: borderWidth.hairline,
    paddingTop: spacing[12],
  },
  arrow: {
    width: size.iconButton.md,
    height: size.iconButton.md,
    borderRadius: size.iconButton.md / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
