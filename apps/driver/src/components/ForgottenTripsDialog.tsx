import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatPrice, relativeDay, type Trip } from '@trustcab/core';
import { Button, colors, FadeScroll, Handle, layout, radius, spacing, Text } from '@trustcab/ui';


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
  const insets = useSafeAreaInsets();
  const count = items.length;

  return (
    <Modal visible={count > 0} transparent animationType="fade" onRequestClose={onLater} statusBarTranslucent>
      <View style={styles.layer}>
        <Pressable style={styles.scrim} onPress={onLater} accessibilityLabel="Responder depois" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[16], maxHeight: layout.sheetMaxHeight }]} accessibilityViewIsModal>
          <Handle />
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
                  <Button label="Não aconteceu" icon="close" size="sm" variant="surface" destructive style={styles.grow} onPress={() => onDidNotHappen(item)} />
                </View>
              </View>
            ))}
          </FadeScroll>

          <Button label="Responder depois" size="sm" variant="ghost" onPress={onLater} style={styles.center} />
        </View>
      </View>
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
    gap: spacing[16],
  },
  head: { gap: spacing[8], paddingHorizontal: spacing[4] },
  list: { gap: spacing[8] },
  item: { backgroundColor: colors.surface, borderRadius: radius.block, padding: spacing[16], gap: spacing[8] },
  itemHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing[12] },
  itemWhen: { flex: 1, gap: spacing[2] },
  actions: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[4] },
  grow: { flex: 1 },
  center: { alignSelf: 'center' },
});
