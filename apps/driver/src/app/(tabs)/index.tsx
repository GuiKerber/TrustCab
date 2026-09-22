import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, cardColor, type CardOrigin, colors, DaySlider, isClosed, layout, ScreenStatus, spacing, Text, TripStack } from '@trustcab/ui';
import { ForgottenTripsDialog, type ForgottenTrip } from '@/components/ForgottenTripsDialog';
import { TripSheet } from '@/components/TripSheet';
import { TopBar } from '@/components/TopBar';
import { useTripActions } from '@/components/useTripActions';
import { usePassengerStore, withApprovedTrips, withoutEnded, withState } from '@/data/passengers';
import { missingSetup, useProfile } from '@/data/profile';
import { type Day, dayKey, formatPrice, isForgotten, isSameDay, relativeDay, sampleMonth, sampleMonthDays, samplePassengers, sampleTripRequests, startOfDay, type Trip, useNow, useSyncState } from '@trustcab/core';
import { useTripSignals } from '@/data/tripSignals';
import { useTripNotifications } from '@/lib/notifications';

// Quantos dias para trás a Home procura viagens esquecidas (abertas depois do horário).
const FORGOTTEN_LOOKBACK_DAYS = 7;
// Quantos dias para frente as notificações de "Hora de sair" ficam agendadas.
const NOTIFY_AHEAD_DAYS = 7;

// Home: título editorial, dias e a pilha de cartões das viagens do dia. A tela rola; puxar um cartão é segurar e arrastar.
// Ao abrir o app, pergunta sobre viagens que passaram do horário sem conclusão.
export default function Home() {
  const params = useLocalSearchParams<{ trip?: string; day?: string }>();
  const now = useNow();
  const clock = useNow('minute');
  const month = useMemo(() => sampleMonth(now), [now]);
  const requests = useMemo(() => sampleTripRequests(now), [now]);
  const passengers = usePassengerStore();
  const people = useMemo(() => withState(samplePassengers(now), passengers), [now, passengers]);
  const signals = useTripSignals();
  const profile = useProfile();
  const missing = missingSetup(profile);
  const focused = useIsFocused();
  const sync = useSyncState();
  const [selected, setSelected] = useState(() => startOfDay(now));
  const [open, setOpen] = useState<{ id: string; color: string; origin: CardOrigin | null } | null>(null);
  // "Responder depois" some até o app voltar do segundo plano.
  const [askLater, setAskLater] = useState(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAskLater(false);
    });
    return () => subscription.remove();
  }, []);

  const prepare = (days: Day[]) =>
    withoutEnded(withApprovedTrips(days, requests, passengers), people, now).map((day) => ({
      ...day,
      trips: day.trips.map((trip): Trip => ({ ...trip, status: signals[trip.id] ?? trip.status })),
    }));

  // Mês atual e o anterior: a Home mostra de hoje em diante; as notificações e as viagens esquecidas olham em volta.
  const allDays = useMemo(() => {
    const previous = sampleMonthDays(new Date(now.getFullYear(), now.getMonth() - 1, 1), now);
    const next = sampleMonthDays(new Date(now.getFullYear(), now.getMonth() + 1, 1), now);
    return prepare([...previous, ...month.days, ...next]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, month, requests, passengers, people, signals]);

  const days = allDays.filter((day) => day.date >= startOfDay(now) && day.date.getMonth() === now.getMonth());
  const selectedDay = allDays.find((day) => isSameDay(day.date, selected));

  // Ordem de embarque: quem vem primeiro fica no topo; concluídas e canceladas vão para o fim.
  const trips = [...(selectedDay?.trips ?? [])].sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.time.localeCompare(b.time));
  // Hoje, Amanhã e Ontem ficam no tamanho grande; datas ("Domingo, 20/09") descem um tamanho para caber numa linha.
  const dayTitle = relativeDay(selected, now);
  const titleVariant = dayTitle.includes('/') ? 'displaySm' : 'display';
  const openTrip = open ? (trips.find((t) => t.id === open.id) ?? null) : null;
  // Ganho do dia: só viagens concluídas. Dia futuro ainda não tem ganho.
  const earned = trips.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.priceCents, 0);
  const future = startOfDay(selected) > startOfDay(now);

  const actions = useTripActions({ now, date: selected, close: () => setOpen(null) });

  const forgotten: ForgottenTrip[] = allDays
    .filter((day) => day.date >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - FORGOTTEN_LOOKBACK_DAYS))
    .flatMap((day) => day.trips.filter((trip) => isForgotten(day.date, trip, clock)).map((trip) => ({ date: day.date, trip })));

  const ahead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + NOTIFY_AHEAD_DAYS);
  useTripNotifications(
    allDays.filter((day) => day.date >= startOfDay(now) && day.date <= ahead).flatMap((day) => day.trips.map((trip) => ({ date: day.date, trip }))),
    profile.notifications,
  );

  // Link direto para uma viagem (notificação ou link externo): abre o dia e a folha dela.
  useEffect(() => {
    if (!params.trip || !params.day) return;
    const day = allDays.find((entry) => dayKey(entry.date) === params.day);
    const index = day?.trips.findIndex((trip) => trip.id === params.trip) ?? -1;
    if (!day || index < 0) return;
    setSelected(startOfDay(day.date));
    setOpen({ id: params.trip, color: cardColor(day.trips[index], index), origin: null });
    router.setParams({ trip: undefined, day: undefined });
  }, [params.trip, params.day, allDays]);

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="home" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title={`Olá, ${month.driverFirstName}`} />

        {missing.any ? (
          <Banner
            icon="lock"
            tone="warning"
            title={missing.vehicle && missing.pix ? 'Cadastre seu carro e sua chave Pix' : missing.vehicle ? 'Cadastre seu carro' : 'Cadastre sua chave Pix'}
            text="Sem eles, você não consegue começar as viagens. O carro vai no aviso “Cheguei”; o Pix vira o QR Code do pagamento."
            actions={[
              ...(missing.vehicle ? [{ label: 'Cadastrar carro', icon: 'directions_car' as const, onPress: () => router.push('/vehicle') }] : []),
              ...(missing.pix ? [{ label: 'Cadastrar Pix', icon: 'qr_code_2' as const, onPress: () => router.push('/pix') }] : []),
            ]}
          />
        ) : null}

        <View style={styles.title}>
          <Text variant={titleVariant}>{dayTitle}</Text>
          <Text variant={titleVariant} tone="secondary">
            {trips.length === 1 ? '1 viagem' : `${trips.length} viagens`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.total}>
            {trips.length === 0 ? 'Dia livre' : future ? 'Os ganhos entram quando você concluir as viagens' : `${formatPrice(earned)} ganhos no dia`}
          </Text>
        </View>

        <DaySlider days={days} selected={selected} today={now} onSelect={setSelected} />

        {trips.length > 0 ? (
          <TripStack trips={trips} onOpen={(trip, color, origin) => setOpen({ id: trip.id, color, origin })} />
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              Nenhuma viagem neste dia.
            </Text>
            <Text variant="small" tone="secondary">
              Seus passageiros podem pedir viagens a qualquer momento.
            </Text>
          </View>
        )}
      </ScrollView>

      <TripSheet
        trip={openTrip}
        color={open?.color ?? colors.cards[0]}
        origin={open?.origin}
        date={selected}
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

      <ForgottenTripsDialog
        items={focused && !open && !askLater ? forgotten : []}
        now={now}
        onComplete={({ date, trip }) => actions.setStatus(trip, 'completed', date)}
        onDidNotHappen={({ date, trip }) => actions.setStatus(trip, 'cancelled', date)}
        onLater={() => setAskLater(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  // Com muitas viagens a pilha fica mais alta que a tela: a home rola.
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[8],
    paddingBottom: layout.scrollEnd,
    gap: spacing[20],
  },
  title: { paddingHorizontal: spacing[4] },
  total: { marginTop: spacing[8] },
  empty: { paddingTop: spacing[40], paddingHorizontal: spacing[4], gap: spacing[8] },
});
