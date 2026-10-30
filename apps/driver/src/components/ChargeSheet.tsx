import { StyleSheet, View } from 'react-native';

import { formatPrice, type Trip } from '@trustcab/core';
import { Button, colors, FadeScroll, InlineNotice, Label, layout, radius, Sheet, spacing, Text } from '@trustcab/ui';


export type ChargeLine = { date: Date; trip: Trip };

function day(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Prévia da cobrança exatamente como a passageira vai ler no WhatsApp. Enviar abre a conversa com
// este texto escrito; quem toca em enviar é o motorista.
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
  const firstName = passenger.split(' ')[0];

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel="Fechar prévia">
      <View style={styles.head}>
        <Label>{`Prévia · WhatsApp de ${firstName}`}</Label>
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
          <InlineNotice
            icon="check_circle"
            text={paidCount === 1 ? '1 viagem já paga na hora fica fora da cobrança.' : `${paidCount} viagens já pagas na hora ficam fora da cobrança.`}
          />
        </View>
      ) : null}

      {pixKey ? (
        <Button label={`Abrir o WhatsApp de ${firstName}`} icon="chat" variant="light" onPress={onSend} />
      ) : (
        <>
          <View style={styles.notice}>
            <InlineNotice tone="warning" text="Para cobrar, adicione sua chave Pix. Ela vai junto na mensagem para o passageiro pagar." />
          </View>
          <Button label="Adicionar chave Pix" icon="qr_code_2" variant="light" onPress={onAddPix} />
        </>
      )}
      <Button label="Voltar sem enviar" size="sm" variant="ghost" onPress={onClose} style={styles.back} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[4], paddingHorizontal: layout.textInset },
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
  notice: { paddingHorizontal: layout.textInset },
  back: { alignSelf: 'center' },
});
