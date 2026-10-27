import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPrice, formatPriceShort, monthName, useNow, useSyncState, weekdayShort, type Trip } from '@trustcab/core';
import { Block, Button, colors, Icon, Label, layout, Pills, ScreenStatus, size, spacing, Text } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { notifyDriver } from '@/data/chat';
import { knownDrivers, myDriver, useConnections } from '@/data/connections';
import { PAYMENT_STATE, paymentState, reportPaid, usePayments } from '@/data/payments';
import { me } from '@/data/sample';
import { useMonthTrips } from '@/data/trips';

// Quantos meses para trás dá para ver.
const HISTORY = 6;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

// Gastos: quanto você gastou no mês e o que falta pagar ao seu motorista. Só entram viagens concluídas.
// "Já paguei tudo" avisa o motorista, que confere e confirma.
export default function Spending() {
  const now = useNow();
  const sync = useSyncState();
  const payments = usePayments();
  const connections = useConnections();
  const drivers = knownDrivers(connections, now);
  const [month, setMonth] = useState(() => monthKey(now));

  const months = Array.from({ length: HISTORY + 1 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1));
  const current = months.find((m) => monthKey(m) === month) ?? months[0];
  const days = useMonthTrips(current, now);
  const name = monthName(current);

  const doneDays = days
    .map((day) => ({ date: day.date, trips: day.trips.filter((t) => t.status === 'completed') }))
    .filter((day) => day.trips.length > 0)
    .reverse();
  const done = doneDays.flatMap((day) => day.trips.map((trip) => ({ date: day.date, trip })));
  const total = done.reduce((sum, { trip }) => sum + trip.priceCents, 0);
  const stateOf = ({ trip, date }: { trip: Trip; date: Date }) => paymentState(payments, trip.id, date, now);
  const due = done.filter((item) => stateOf(item) === 'due');
  const reported = done.filter((item) => stateOf(item) === 'reported');
  const dueTotal = due.reduce((sum, { trip }) => sum + trip.priceCents, 0);
  // Quem recebe: seu motorista agora ou, se você saiu da rede, quem dirigiu as viagens do mês.
  const driver = myDriver(connections, now) ?? drivers.find((d) => d.name === done[0]?.trip.driver) ?? null;

  const payAll = () => {
    if (!driver) return;
    reportPaid(due.map(({ trip }) => trip.id), new Date());
    notifyDriver(
      driver.id,
      `${me.firstName} avisou que pagou ${formatPrice(dueTotal)} das viagens de ${name}.`,
      { title: 'Pagamento avisado', body: `${me.firstName} pagou ${formatPrice(dueTotal)} de ${name}. Confira e confirme.` },
      'paid_reported',
    );
  };

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="list" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Gastos" />

        <Pills
          items={months.map((m) => ({
            key: monthKey(m),
            label: m.getFullYear() === now.getFullYear() ? monthName(m).slice(0, 3) : `${monthName(m).slice(0, 3)} ${String(m.getFullYear()).slice(2)}`,
            accessibilityLabel: `${monthName(m)} de ${m.getFullYear()}`,
          }))}
          selected={monthKey(current)}
          onSelect={setMonth}
          accessibilityLabel="Mês"
        />

        <View style={styles.title}>
          <Text variant="display">{formatPriceShort(total)}</Text>
          <Text variant="display" tone="secondary">
            {`em ${name}`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.subtitle}>
            {done.length === 0 ? 'Nenhuma viagem concluída' : dueTotal > 0 ? `${formatPrice(dueTotal)} a pagar` : 'Tudo pago'}
          </Text>
        </View>

        {driver && due.length > 0 ? (
          <Block style={styles.pay}>
            <Label>{`A pagar para ${driver.name.split(' ')[0]}`}</Label>
            <Text variant="title">{formatPrice(dueTotal)}</Text>
            <Text variant="small" tone="secondary" selectable>{`Pix (${driver.pix.label}): ${driver.pix.key}`}</Text>
            <Button label="Já paguei tudo" icon="paid" variant="light" onPress={payAll} accessibilityHint={`Avisa ${driver.name.split(' ')[0]} que você pagou as viagens de ${name}`} />
          </Block>
        ) : driver && reported.length > 0 ? (
          <Block style={styles.pay}>
            <View style={styles.row} accessibilityLiveRegion="polite">
              <Icon name="schedule" size={size.icon.md} color={colors.text} />
              <Text variant="bodyMedium" style={styles.grow}>
                {`Você avisou que pagou. Falta ${driver.name.split(' ')[0]} confirmar.`}
              </Text>
            </View>
            <Button label="Desfazer aviso" icon="undo" size="sm" variant="ghost" onPress={() => reportPaid(reported.map(({ trip }) => trip.id), null)} style={styles.alignStart} />
          </Block>
        ) : null}

        {doneDays.length > 0 ? (
          <View style={styles.days}>
            {doneDays.map(({ date, trips }) => (
              <Block key={date.toISOString()} style={styles.day}>
                <View style={styles.dayHead}>
                  <Text variant="bodyMedium">{`${weekdayShort(date)}, ${date.getDate()}`}</Text>
                  <Text variant="bodyMedium">{formatPrice(trips.reduce((sum, t) => sum + t.priceCents, 0))}</Text>
                </View>
                {trips.map((trip) => {
                  const state = PAYMENT_STATE[paymentState(payments, trip.id, date, now)];
                  return (
                    <View key={trip.id} style={styles.tripRow} accessible accessibilityLabel={`${trip.time}, ${trip.driver}, ${formatPrice(trip.priceCents)}, ${state.label}`}>
                      <Text variant="small" tone="secondary" style={styles.tripTime}>
                        {trip.time}
                      </Text>
                      <Text variant="small" tone="secondary" style={styles.grow} numberOfLines={1}>
                        {`${trip.origin} → ${trip.destination}`}
                      </Text>
                      <Icon name={state.icon} size={size.icon.sm} color={colors.textSecondary} />
                      <Text variant="small" tone="secondary">
                        {state.label}
                      </Text>
                    </View>
                  );
                })}
              </Block>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              {`Nenhuma viagem concluída em ${name}.`}
            </Text>
            <Text variant="small" tone="secondary">
              As viagens entram aqui quando o motorista conclui.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: layout.scrollEnd, gap: spacing[20] },
  title: { paddingHorizontal: spacing[4] },
  subtitle: { marginTop: spacing[8] },
  pay: { gap: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  grow: { flex: 1 },
  alignStart: { alignSelf: 'flex-start' },
  days: { gap: spacing[8] },
  day: { gap: spacing[8] },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between' },
  tripRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], minHeight: size.icon.lg },
  tripTime: { fontVariant: ['tabular-nums'] },
  empty: { paddingTop: spacing[20], paddingHorizontal: spacing[4], gap: spacing[8] },
});
