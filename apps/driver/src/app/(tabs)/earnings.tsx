import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Block, Button, colors, focusRing, layout, Pills, radius, ScreenStatus, size, spacing, stateOpacity, Text, useInteraction } from '@trustcab/ui';
import { ChargeSheet, type ChargeLine } from '@/components/ChargeSheet';
import { TopBar } from '@/components/TopBar';
import { formatPrice, formatPriceShort, monthName, passengerIdOf, sampleHistory, type Trip, useNow, useSyncState, weekdayShort } from '@trustcab/core';
import { chargeKey, setChargeSent, useChargesSent } from '@/data/charges';
import { removeMessage, sendMessage } from '@/data/chat';
import { usePaidTrips, useReportedTrips } from '@/data/payments';
import { useProfile } from '@/data/profile';
import { useTripSignals } from '@/data/tripSignals';

const ALL = 'todos';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function sum(trips: Trip[]) {
  return trips.reduce((total, trip) => total + trip.priceCents, 0);
}

function countLabel(count: number) {
  return count === 1 ? '1 viagem' : `${count} viagens`;
}

// Ganhos: total do mês, quanto cada passageiro gastou e a quebra por dia e por viagem.
// Só entram viagens concluídas: agendadas, a caminho e canceladas ficam fora de todos os totais.
export default function Earnings() {
  const params = useLocalSearchParams<{ passenger?: string; month?: string }>();
  const now = useNow();
  const history = useMemo(() => sampleHistory(now), [now]);
  const signals = useTripSignals();
  const sent = useChargesSent();
  const paid = usePaidTrips();
  const reported = useReportedTrips();
  const sync = useSyncState();
  const { pix } = useProfile();
  const pixKey = pix?.key ?? null;

  const [month, setMonth] = useState(() => monthKey(now));
  const [passenger, setPassenger] = useState(ALL);
  const [preview, setPreview] = useState(false);

  // Quem chega pelo "Ver gastos" de uma viagem já vê o passageiro e o mês daquela viagem.
  useEffect(() => {
    if (params.passenger) setPassenger(params.passenger);
    // Mês que ainda não chegou não tem ganhos: fica no mês atual.
    if (params.month && history.some((entry) => monthKey(entry.month) === params.month)) setMonth(params.month);
  }, [params.passenger, params.month, history]);

  const current = history.find((entry) => monthKey(entry.month) === month) ?? history[history.length - 1];
  const days = current.days.map((day) => ({
    date: day.date,
    trips: day.trips.map((trip): Trip => ({ ...trip, status: signals[trip.id] ?? trip.status })),
  }));

  const passengers = [...new Set(days.flatMap((day) => day.trips.map((trip) => trip.passenger)))];
  const matches = (trip: Trip) => passenger === ALL || trip.passenger === passenger;

  const doneDays = days
    .map((day) => ({ date: day.date, trips: day.trips.filter((trip) => trip.status === 'completed' && matches(trip)) }))
    .filter((day) => day.trips.length > 0)
    .reverse();
  const done = doneDays.flatMap((day) => day.trips);

  const total = sum(done);
  const name = monthName(current.month);
  const firstName = passenger === ALL ? '' : passenger.split(' ')[0];

  const byPassenger = passengers.map((person, index) => {
    const trips = days.flatMap((day) => day.trips).filter((trip) => trip.status === 'completed' && trip.passenger === person);
    return { person, trips, total: sum(trips), color: colors.cards[index % colors.cards.length] };
  });

  // Viagem paga na hora (QR Code) não entra na cobrança do mês.
  const chargeLines: ChargeLine[] = [...doneDays]
    .reverse()
    .flatMap((day) => day.trips.filter((trip) => !paid[trip.id]).map((trip) => ({ date: day.date, trip })));
  const chargeTotal = sum(chargeLines.map((line) => line.trip));
  const paidCount = done.filter((trip) => paid[trip.id]).length;
  const key = passenger === ALL ? null : chargeKey(passenger, current.month);
  const sentAt = key ? sent[key] : undefined;

  // Mês mais recente primeiro, para o mês atual aparecer sem rolar.
  const monthItems = [...history].reverse().map((entry) => ({
    key: monthKey(entry.month),
    label:
      entry.month.getFullYear() === now.getFullYear()
        ? monthName(entry.month).slice(0, 3)
        : `${monthName(entry.month).slice(0, 3)} ${String(entry.month.getFullYear()).slice(2)}`,
    accessibilityLabel: `${monthName(entry.month)} de ${entry.month.getFullYear()}`,
  }));
  const passengerItems = [
    { key: ALL, label: 'Todos', accessibilityLabel: 'Todos os passageiros' },
    ...passengers.map((person) => ({ key: person, label: person.split(' ')[0], accessibilityLabel: person })),
  ];

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="list" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Ganhos" />

        <Pills items={monthItems} selected={monthKey(current.month)} onSelect={setMonth} accessibilityLabel="Mês" />

        <View style={styles.title}>
          <Text variant="display">{formatPriceShort(total)}</Text>
          <Text variant="display" tone="secondary">
            {passenger === ALL ? `em ${name}` : `de ${firstName}`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.subtitle}>
            {done.length > 0 ? `${countLabel(done.length)} concluídas` : 'Nenhuma viagem concluída'}
          </Text>
        </View>

        <Pills items={passengerItems} selected={passenger} onSelect={setPassenger} accessibilityLabel="Passageiro" />

        {passenger === ALL && byPassenger.length > 0 ? (
          <View style={styles.people}>
            {byPassenger.map(({ person, trips, total: personTotal, color }, index) => (
              <PersonCard
                key={person}
                person={person}
                count={trips.length}
                totalCents={personTotal}
                color={color}
                first={index === 0}
                last={index === byPassenger.length - 1}
                onPress={() => setPassenger(person)}
              />
            ))}
          </View>
        ) : null}

        {doneDays.length > 0 ? (
          <View style={styles.days}>
            {doneDays.map(({ date, trips }) => (
              <Block key={date.toISOString()} style={styles.day}>
                <View style={styles.dayHead}>
                  <Text variant="bodyMedium">{`${weekdayShort(date)}, ${date.getDate()}`}</Text>
                  <Text variant="bodyMedium">{formatPrice(sum(trips))}</Text>
                </View>
                {trips.map((trip) => (
                  <View key={trip.id} style={styles.tripRow}>
                    <Text variant="small" tone="secondary" style={styles.tripTime}>
                      {trip.time}
                    </Text>
                    <Text variant="small" tone="secondary" style={styles.tripWho} numberOfLines={1}>
                      {passenger === ALL ? trip.passenger : `${trip.origin} → ${trip.destination}`}
                    </Text>
                    <Text variant="small" tone="secondary" style={styles.tripPrice}>
                      {paid[trip.id] ? `${formatPrice(trip.priceCents)} · pago` : reported[trip.id] ? `${formatPrice(trip.priceCents)} · avisou que pagou` : formatPrice(trip.priceCents)}
                    </Text>
                  </View>
                ))}
              </Block>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              {passenger === ALL ? `Nenhuma viagem concluída em ${name}.` : `${firstName} não tem viagens concluídas em ${name}.`}
            </Text>
            <Text variant="small" tone="secondary">
              As viagens entram aqui quando você toca em "Concluir viagem".
            </Text>
          </View>
        )}

        {passenger !== ALL && done.length > 0 && key ? (
          <View style={styles.charge}>
            {sentAt ? (
              <Block style={styles.sent}>
                <Text variant="bodyMedium">{`Cobrança de ${name} enviada para ${firstName}`}</Text>
                <Text variant="small" tone="secondary">
                  {`Enviada em ${sentAt.getDate()}/${sentAt.getMonth() + 1}, às ${String(sentAt.getHours()).padStart(2, '0')}:${String(
                    sentAt.getMinutes(),
                  ).padStart(2, '0')}.`}
                </Text>
                <View style={styles.sentActions}>
                  <Button
                    label="Abrir chat"
                    icon="chat"
                    size="sm"
                    variant="surface"
                    onPress={() => router.push({ pathname: '/chat/[id]', params: { id: passengerIdOf(passenger) } })}
                  />
                  <Button label="Desfazer envio" icon="undo" size="sm" variant="ghost" destructive onPress={() => {
                      removeMessage(passengerIdOf(passenger), key);
                      setChargeSent(key, null);
                    }}
                  />
                </View>
              </Block>
            ) : chargeLines.length === 0 ? (
              <Block style={styles.sent}>
                <Text variant="bodyMedium">{`${firstName} já pagou todas as viagens de ${name}`}</Text>
                <Text variant="small" tone="secondary">
                  Cada viagem foi marcada como paga na hora. Não há o que cobrar neste mês.
                </Text>
              </Block>
            ) : (
              <>
                <Button label="Gerar cobrança" icon="request_quote" variant="light" onPress={() => setPreview(true)} />
                <Text variant="small" tone="secondary" style={styles.chargeHint}>
                  {paidCount > 0
                    ? `Envia no chat de ${firstName} as viagens de ${name} ainda não pagas, com data, horário e valor, o total e sua chave Pix.`
                    : `Envia no chat de ${firstName} as viagens de ${name}, com data, horário e valor, o total e sua chave Pix.`}
                </Text>
              </>
            )}
          </View>
        ) : null}
      </ScrollView>

      {key ? (
        <ChargeSheet
          visible={preview}
          passenger={passenger}
          monthLabel={name}
          lines={chargeLines}
          totalCents={chargeTotal}
          pixKey={pixKey}
          paidCount={paidCount}
          onClose={() => setPreview(false)}
          onAddPix={() => {
            setPreview(false);
            router.push('/pix');
          }}
          onSend={() => {
            const lines = chargeLines.map(({ date, trip }) => `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')} · ${trip.time} — ${formatPrice(trip.priceCents)}`);
            sendMessage(
              passengerIdOf(passenger),
              [`Cobrança de ${name}`, ...lines, `Total: ${formatPrice(chargeTotal)}`, `Pix: ${pixKey}`].join('\n'),
              key,
            );
            setChargeSent(key, new Date());
            setPreview(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

// Cartão colorido com o total de um passageiro no mês. Tocar filtra a tela por ele.
function PersonCard({
  person,
  count,
  totalCents,
  color,
  first,
  last,
  onPress,
}: {
  person: string;
  count: number;
  totalCents: number;
  color: string;
  first: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const { hovered, focused, handlers } = useInteraction();
  return (
    <Pressable
      {...handlers}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${person}: ${formatPrice(totalCents)} em ${countLabel(count)}. Ver só as viagens de ${person.split(' ')[0]}`}
      style={({ pressed }) => [
        styles.person,
        { backgroundColor: color, opacity: stateOpacity({ pressed, hovered, disabled: false }) },
        first && styles.personFirst,
        last && styles.personLast,
        focused && focusRing(),
      ]}>
      <View style={styles.personText}>
        <Text variant="heading" tone="onCard" numberOfLines={1}>
          {person}
        </Text>
        <Text variant="small" tone="onCardMuted">
          {countLabel(count)}
        </Text>
      </View>
      <Text variant="title" tone="onCard">
        {formatPriceShort(totalCents)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[8],
    paddingBottom: layout.scrollEnd,
    gap: spacing[20],
  },
  title: { paddingHorizontal: spacing[4] },
  subtitle: { marginTop: spacing[8] },
  people: { gap: spacing[2] },
  person: {
    minHeight: size.personCardMinHeight,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    borderRadius: radius.joined,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  personFirst: { borderTopLeftRadius: radius.block, borderTopRightRadius: radius.block },
  personLast: { borderBottomLeftRadius: radius.block, borderBottomRightRadius: radius.block },
  personText: { flex: 1, gap: spacing[2] },
  days: { gap: layout.gap },
  day: { gap: spacing[8], paddingVertical: spacing[16] },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[4] },
  tripRow: { flexDirection: 'row', gap: spacing[12] },
  tripTime: { width: size.timeColumn, fontVariant: ['tabular-nums'] },
  tripWho: { flex: 1 },
  tripPrice: { fontVariant: ['tabular-nums'] },
  empty: { paddingTop: spacing[20], paddingHorizontal: spacing[4], gap: spacing[8] },
  charge: { gap: spacing[12], marginTop: spacing[8] },
  chargeHint: { paddingHorizontal: spacing[4], textAlign: 'center' },
  sent: { gap: spacing[4] },
  sentActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8], marginTop: spacing[8] },
});
