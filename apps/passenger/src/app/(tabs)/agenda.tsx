import { useIsFocused } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayKey, isSameDay, monthName, useNow, useSyncState } from '@trustcab/core';
import { AgendaDay, cardColor, colors, IconButton, layout, MonthGrid, ScreenStatus, spacing, Text } from '@trustcab/ui';

import { OpenTripSheet } from '@/components/OpenTripSheet';
import { TopBar } from '@/components/TopBar';
import { useTripActions } from '@/components/useTripActions';
import { usePayments } from '@/data/payments';
import { useMonthTrips } from '@/data/trips';

// Quantos meses dá para navegar para trás e para frente a partir do mês atual.
const RANGE = 6;

// Agenda do passageiro: a mesma do motorista. Mês navegável em blocos e, abaixo, dia a dia, com quem dirige cada viagem.
export default function Agenda() {
  const now = useNow();
  const sync = useSyncState();
  const payments = usePayments();
  const focused = useIsFocused();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(now);
  const [open, setOpen] = useState<{ id: string; date: Date; color: string } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const listY = useRef(0);
  const dayY = useRef<Record<string, number>>({});

  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const days = useMonthTrips(month, now);
  const monthTrips = days.reduce((total, day) => total + day.trips.filter((trip) => trip.status !== 'cancelled' && trip.status !== 'declined').length, 0);
  const waiting = days.reduce((total, day) => total + day.trips.filter((trip) => trip.status === 'requested').length, 0);
  const title = monthName(month);
  const openTrip = open ? (days.find((day) => isSameDay(day.date, open.date))?.trips.find((trip) => trip.id === open.id) ?? null) : null;
  const actions = useTripActions({ now, date: open?.date ?? now });

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
              {`${monthTrips === 1 ? '1 viagem' : `${monthTrips} viagens`}${waiting > 0 ? ` · ${waiting} esperando aprovação` : ''}`}
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
                personOf={(trip) => trip.driver ?? 'Motorista'}
                onOpen={(trip, index) => setOpen({ id: trip.id, date, color: cardColor(trip, index) })}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <OpenTripSheet
        trip={openTrip}
        open={open ? { color: open.color, origin: null } : null}
        date={open?.date ?? now}
        now={now}
        visible={focused}
        actions={actions}
        payments={payments}
        onClose={() => setOpen(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: layout.scrollEnd, gap: spacing[20] },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { alignItems: 'center', gap: spacing[2] },
  list: { gap: spacing[6], marginTop: spacing[8] },
});
