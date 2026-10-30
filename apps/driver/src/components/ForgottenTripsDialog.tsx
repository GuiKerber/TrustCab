import { StyleSheet, View } from 'react-native';

import { formatPrice, relativeDay, type Trip } from '@trustcab/core';
import { Button, colors, FadeScroll, layout, radius, Sheet, spacing, Text } from '@trustcab/ui';


export type ForgottenTrip = { date: Date; trip: Trip };

// Ao abrir o app: viagens que já passaram do horário e ficaram abertas. Para cada uma, você diz se aconteceu.
// "Concluída" entra nos ganhos; "Não aconteceu" cancela. "Depois" fecha e pergunta de novo na próxima abertura.
export function ForgottenTripsDialog({
  items,
  now,
  onComplete,
  onDidNotHappen,
  onLater,
}: {
  items: ForgottenTrip[];
  now: Date;
  onComplete: (item: ForgottenTrip) => void;
  onDidNotHappen: (item: ForgottenTrip) => void;
  onLater: () => void;
}) {
  const count = items.length;

  return (
    <Sheet visible={count > 0} onClose={onLater} closeLabel="Responder depois">
      <View style={styles.head}>
        <Text variant="title" accessibilityRole="header">
          {count === 1 ? 'Você concluiu esta viagem?' : `Você concluiu estas ${count} viagens?`}
        </Text>
        <Text variant="body" tone="secondary">
          Já passaram do horário e continuam abertas. Só as concluídas entram nos seus ganhos.
        </Text>
      </View>

      <FadeScroll background={colors.ground} contentContainerStyle={styles.list}>
        {items.map((item) => (
          <View key={item.trip.id} style={styles.item}>
            <View style={styles.itemHead}>
              <View style={styles.itemWhen}>
                <Text variant="small" tone="secondary">
                  {`${relativeDay(item.date, now)} · ${item.trip.time}`}
                </Text>
                <Text variant="bodyMedium">{item.trip.passenger}</Text>
              </View>
              <Text variant="bodyMedium">{formatPrice(item.trip.priceCents)}</Text>
            </View>
            <Text variant="small" tone="secondary" numberOfLines={2}>
              {`${item.trip.origin} → ${item.trip.destination}`}
            </Text>
            <View style={styles.actions}>
              <Button label="Concluída" icon="done_all" size="sm" variant="light" style={styles.grow} onPress={() => onComplete(item)} />
              {/* Sobre o bloco "surface", um botão "surface" perde o contorno: é o fantasma que ele já parecia. */}
              <Button label="Não aconteceu" icon="close" size="sm" variant="ghost" destructive style={styles.grow} onPress={() => onDidNotHappen(item)} />
            </View>
          </View>
        ))}
      </FadeScroll>

      <Button label="Responder depois" size="sm" variant="ghost" onPress={onLater} style={styles.center} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing[8], paddingHorizontal: layout.textInset },
  list: { gap: spacing[8] },
  item: { backgroundColor: colors.surface, borderRadius: radius.block, padding: spacing[16], gap: spacing[8] },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[12] },
  itemWhen: { flex: 1, gap: spacing[4] },
  actions: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[4] },
  grow: { flex: 1 },
  center: { alignSelf: 'center' },
});
