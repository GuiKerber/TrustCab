import { useIsFocused } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgendaDay, cardColor, colors, IconButton, layout, MonthGrid, ScreenStatus, spacing, Text } from '@trustcab/ui';
import { TripSheet } from '@/components/TripSheet';
import { TopBar } from '@/components/TopBar';
import { dayKey, isSameDay, monthName, sampleMonthDays, samplePassengers, sampleTripRequests, type Trip, useNow, useSyncState } from '@trustcab/core';
import { useTripActions } from '@/components/useTripActions';
import { usePassengerStore, withApprovedTrips, withoutEnded, withState } from '@/data/passengers';
import { useTripSignals } from '@/data/tripSignals';

// Quantos meses dá para navegar para trás e para frente a partir do mês atual.
const RANGE = 6;

// Agenda: o mês é navegável. A grade mostra o mês em blocos, com uma bolinha por viagem;
// abaixo, o mesmo mês dia a dia. Tocar num dia da grade leva até ele na lista.
export default function Agenda() {
  const now = useNow();
  const signals = useTripSignals();
  const sync = useSyncState();
  const requests = useMemo(() => sampleTripRequests(now), [now]);
  const passengers = usePassengerStore();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(now);
  const [open, setOpen] = useState<{ id: string; date: Date; color: string } | null>(null);
  const focused = useIsFocused();
  const scroll = useRef<ScrollView>(null);
  const listY = useRef(0);
  const dayY = useRef<Record<string, number>>({});

  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const people = withState(samplePassengers(now), passengers);
  const days = withoutEnded(withApprovedTrips(sampleMonthDays(month, now), requests, passengers), people, now).map((day) => ({
    date: day.date,
    trips: day.trips
      .map((trip): Trip => ({ ...trip, status: signals[trip.id] ?? trip.status }))
      .sort((a, b) => a.time.localeCompare(b.time)),
  }));
  const monthTrips = days.reduce((total, day) => total + day.trips.filter((trip) => trip.status !== 'cancelled').length, 0);
  const title = monthName(month);
  const openTrip = open ? (days.find((day) => isSameDay(day.date, open.date))?.trips.find((trip) => trip.id === open.id) ?? null) : null;
  const actions = useTripActions({ now, date: open?.date ?? now, close: () => setOpen(null) });

  const changeMonth = (step: number) => {
    const next = offset + step;
    setOffset(next);
    setSelected(next === 0 ? now : null);
    dayY.current = {};
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const selectDay = (date: Date) => {
    setSelected(date);
    const y = dayY.current[dayKey(date)];
    if (y != null) scroll.current?.scrollTo({ y: listY.current + y - spacing[8], animated: true });
  };

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="agenda" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Agenda" />

        <View style={styles.monthNav}>
          <IconButton name="chevron_left" label="Mês anterior" onPress={() => changeMonth(-1)} disabled={offset <= -RANGE} />
          <View style={styles.monthTitle} accessibilityLiveRegion="polite">
            <Text variant="title">{`${title[0].toUpperCase()}${title.slice(1)}`}</Text>
            <Text variant="small" tone="secondary">
              {`${month.getFullYear()} · ${monthTrips === 1 ? '1 viagem' : `${monthTrips} viagens`}`}
            </Text>
          </View>
          <IconButton name="chevron_right" label="Próximo mês" onPress={() => changeMonth(1)} disabled={offset >= RANGE} />
        </View>

        <MonthGrid days={days} selected={selected} today={now} onSelect={selectDay} />

        <View style={styles.list} onLayout={(event) => (listY.current = event.nativeEvent.layout.y)}>
          {days.map(({ date, trips }) => (
            <View key={date.toISOString()} onLayout={(event) => (dayY.current[dayKey(date)] = event.nativeEvent.layout.y)}>
              <AgendaDay
                date={date}
                trips={trips}
                today={now}
                selected={selected ? isSameDay(date, selected) : false}
                onOpen={(trip, index) => setOpen({ id: trip.id, date, color: cardColor(trip, index) })}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <TripSheet
        trip={openTrip}
        color={open?.color ?? colors.cards[0]}
        date={open?.date ?? now}
        now={now}
        visible={focused}
        onClose={() => setOpen(null)}
        onStatus={actions.setStatus}
        onMaps={actions.openMaps}
        onChat={actions.openChat}
        options={actions.options}
        onSpending={actions.openSpending}
        onCancel={actions.cancel}
        paid={actions.isPaid(openTrip)}
        paidByPassenger={actions.isReported(openTrip)}
        onPaid={actions.setPaid}
        onSetup={actions.openSetup}
      />
    </SafeAreaView>
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
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { alignItems: 'center', gap: spacing[2] },
  list: { gap: spacing[6], marginTop: spacing[8] },
});
