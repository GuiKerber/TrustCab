import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { dayKey, isSameDay, relativeDay, startOfDay, useNow, useSyncState } from '@trustcab/core';
import { Banner, Button, cardColor, colors, DaySlider, isClosed, layout, ScreenStatus, spacing, Text, TripStack, type CardOrigin } from '@trustcab/ui';

import { OpenTripSheet } from '@/components/OpenTripSheet';
import { TopBar } from '@/components/TopBar';
import { useTripActions } from '@/components/useTripActions';
import { myDriver, useConnections } from '@/data/connections';
import { usePayments } from '@/data/payments';
import { me } from '@/data/sample';
import { useMonthTrips } from '@/data/trips';

// Home do passageiro: o dia, a faixa de dias e a pilha de viagens, com quem vai dirigir em cada cartão.
// Pedidos esperando aprovação aparecem na pilha com o aviso "Esperando o motorista".
export default function Home() {
  const params = useLocalSearchParams<{ trip?: string; day?: string }>();
  const now = useNow();
  const focused = useIsFocused();
  const sync = useSyncState();
  const connections = useConnections();
  const driver = myDriver(connections, now);
  const payments = usePayments();
  const [selected, setSelected] = useState(() => startOfDay(now));
  const [open, setOpen] = useState<{ id: string; color: string; origin: CardOrigin | null } | null>(null);

  const thisMonth = useMonthTrips(new Date(now.getFullYear(), now.getMonth(), 1), now);
  const nextMonth = useMonthTrips(new Date(now.getFullYear(), now.getMonth() + 1, 1), now);
  const allDays = [...thisMonth, ...nextMonth];
  const days = allDays.filter((day) => day.date >= startOfDay(now));
  const selectedDay = allDays.find((day) => isSameDay(day.date, selected));

  // Ordem de embarque; encerradas vão para o fim.
  const trips = [...(selectedDay?.trips ?? [])].sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.time.localeCompare(b.time));
  const dayTitle = relativeDay(selected, now);
  const titleVariant = dayTitle.includes('/') ? 'displaySm' : 'display';
  const openTrip = open ? (trips.find((t) => t.id === open.id) ?? null) : null;
  const waiting = allDays.filter((day) => day.date >= startOfDay(now)).flatMap((day) => day.trips).filter((t) => t.status === 'requested').length;

  const actions = useTripActions({ now, date: selected });

  // Link direto para uma viagem (notificação ou link): abre o dia e a folha dela.
  useEffect(() => {
    if (!params.trip || !params.day) return;
    const day = allDays.find((entry) => dayKey(entry.date) === params.day);
    const index = day?.trips.findIndex((trip) => trip.id === params.trip) ?? -1;
    if (!day || index < 0) return;
    setSelected(startOfDay(day.date));
    setOpen({ id: params.trip, color: cardColor(day.trips[index], index), origin: null });
    router.setParams({ trip: undefined, day: undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.trip, params.day]);

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="home" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title={`Olá, ${me.firstName}`} />

        {!driver ? (
          <Banner
            icon="group_add"
            tone="warning"
            title="Você ainda não está na rede de um motorista"
            text="Peça o link de convite para quem te leva. Se recebeu um código, é só colocar aqui."
            actions={[{ label: 'Tenho um convite', icon: 'key', onPress: () => router.push('/join') }]}
          />
        ) : waiting > 0 ? (
          <Banner
            icon="hourglass_top"
            title={waiting === 1 ? '1 viagem esperando aprovação' : `${waiting} viagens esperando aprovação`}
            text="Você recebe um aviso quando o motorista responder."
          />
        ) : null}

        <View style={styles.title}>
          <Text variant={titleVariant}>{dayTitle}</Text>
          <Text variant={titleVariant} tone="secondary">
            {trips.length === 1 ? '1 viagem' : `${trips.length} viagens`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.subtitle}>
            {trips.length === 0 ? 'Dia livre' : driver ? `Com ${driver.name.split(' ')[0]}` : 'Nenhuma viagem pela frente'}
          </Text>
          {driver ? (
            <Button label="Pedir viagens" icon="add" size="sm" variant="surface" onPress={() => router.push('/request')} style={styles.request} />
          ) : null}
        </View>

        <DaySlider days={days} selected={selected} today={now} onSelect={setSelected} />

        {trips.length > 0 ? (
          <TripStack trips={trips} personOf={(trip) => trip.driver ?? 'Motorista'} onOpen={(trip, color, origin) => setOpen({ id: trip.id, color, origin })} />
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              Nenhuma viagem neste dia.
            </Text>
            <Text variant="small" tone="secondary">
              {driver ? 'Monte sua semana em "Pedir viagens": cada dia com as viagens dele.' : 'Quando você entrar na rede de um motorista, as viagens aparecem aqui.'}
            </Text>
          </View>
        )}
      </ScrollView>

      <OpenTripSheet trip={openTrip} open={open} date={selected} now={now} visible={focused} actions={actions} payments={payments} onClose={() => setOpen(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: layout.scrollEnd, gap: spacing[20] },
  title: { paddingHorizontal: spacing[4] },
  subtitle: { marginTop: spacing[8] },
  request: { alignSelf: 'flex-start', marginTop: spacing[16] },
  empty: { paddingTop: spacing[40], paddingHorizontal: spacing[4], gap: spacing[8] },
});
