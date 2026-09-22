import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice, type Trip } from '@trustcab/core';
import { Button, colors, FadeScroll, Handle, Icon, Label, layout, radius, size, spacing, Text } from '@trustcab/ui';


export type ChargeLine = { date: Date; trip: Trip };

function day(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Prévia da cobrança exatamente como a passageira vai ler no chat, antes de enviar.
export function ChargeSheet({
  visible,
  passenger,
  monthLabel,
  lines,
  totalCents,
  pixKey,
  paidCount = 0,
  onSend,
  onAddPix,
  onClose,
}: {
  visible: boolean;
  passenger: string;
  monthLabel: string;
  lines: ChargeLine[];
  totalCents: number;
  pixKey: string | null;
  // Viagens do mês que o passageiro já pagou na hora: ficam fora da cobrança.
  paidCount?: number;
  onSend: () => void;
  onAddPix: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const firstName = passenger.split(' ')[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Fechar prévia" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16], maxHeight: layout.sheetMaxHeight }]}>
        <Handle />
        <View style={styles.head}>
          <Label>{`Prévia · chat de ${firstName}`}</Label>
          <Text variant="title">{`Cobrança de ${monthLabel}`}</Text>
        </View>

        <View style={styles.bubble}>
          <Text variant="body">{`Olá, ${firstName}! Estas são as suas viagens de ${monthLabel}:`}</Text>
          <FadeScroll background={colors.surfaceRaised} contentContainerStyle={styles.lines}>
            {lines.map(({ date, trip }) => (
              <View key={trip.id} style={styles.line}>
                <Text variant="small" tone="secondary" style={styles.lineDate}>
                  {`${day(date)} · ${trip.time}`}
                </Text>
                <Text variant="small" style={styles.lineValue}>
                  {formatPrice(trip.priceCents)}
                </Text>
              </View>
            ))}
          </FadeScroll>
          <View style={styles.totalRow}>
            <Text variant="bodyMedium">Total</Text>
            <Text variant="heading">{formatPrice(totalCents)}</Text>
          </View>
          <Text variant="small" tone="secondary">
            {pixKey ? `Pix: ${pixKey}` : 'Pix: sua chave aparece aqui'}
          </Text>
        </View>

        {paidCount > 0 ? (
          <View style={styles.notice}>
            <Icon name="check_circle" size={size.icon.md} color={colors.textSecondary} />
            <Text variant="small" tone="secondary" style={styles.noticeText}>
              {paidCount === 1 ? '1 viagem já paga na hora fica fora da cobrança.' : `${paidCount} viagens já pagas na hora ficam fora da cobrança.`}
            </Text>
          </View>
        ) : null}

        {pixKey ? (
          <Button label={`Enviar no chat de ${firstName}`} icon="send" variant="light" onPress={onSend} />
        ) : (
          <>
            <View style={styles.notice} accessibilityLiveRegion="polite">
              <Icon name="error" size={size.icon.md} color={colors.orange} />
              <Text variant="small" tone="orange" style={styles.noticeText}>
                Para cobrar, adicione sua chave Pix. Ela vai junto na mensagem para o passageiro pagar.
              </Text>
            </View>
            <Button label="Adicionar chave Pix" icon="qr_code_2" variant="light" onPress={onAddPix} />
          </>
        )}
        <Button label="Voltar sem enviar" size="sm" variant="ghost" onPress={onClose} style={styles.back} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.scrim },
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
    gap: spacing[16],
  },
  head: { gap: spacing[4], paddingHorizontal: spacing[4] },
  bubble: {
    flexShrink: 1,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.block,
    borderBottomRightRadius: radius.joined,
    padding: spacing[16],
    gap: spacing[12],
  },
  lines: { gap: spacing[4] },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  lineDate: { fontVariant: ['tabular-nums'] },
  lineValue: { fontVariant: ['tabular-nums'] },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: layout.hairline,
    borderTopColor: colors.lineStrong,
    paddingTop: spacing[12],
  },
  notice: { flexDirection: 'row', gap: spacing[8], alignItems: 'flex-start', paddingHorizontal: spacing[4] },
  noticeText: { flex: 1 },
  back: { alignSelf: 'center' },
});
