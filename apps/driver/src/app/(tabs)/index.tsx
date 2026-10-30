import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cardColor, type CardOrigin, colors, DaySlider, EmptyState, isClosed, layout, ScreenStatus, spacing, Text, TripStack } from '@trustcab/ui';
import { ForgottenTripsDialog, type ForgottenTrip } from '@/components/ForgottenTripsDialog';
import { TripSheet } from '@/components/TripSheet';
import { TopBar } from '@/components/TopBar';
import { useTripActions } from '@/components/useTripActions';
import { useDays } from '@/data/days';
import { useDriver } from '@/data/driver';
import { useProfile } from '@/data/profile';
import { dayKey, formatPrice, isForgotten, isSameDay, startOfDay, useNow, weekdayTitle } from '@trustcab/core';
import { useTripNotifications } from '@/lib/notifications';

// Quantos dias para trás a Home procura viagens esquecidas (abertas depois do horário).
const FORGOTTEN_LOOKBACK_DAYS = 7;
// Quantos dias para frente as notificações de "Hora de sair" ficam agendadas.
const NOTIFY_AHEAD_DAYS = 7;
// Quantos dias a faixa da Home mostra: duas semanas, começando em hoje. Com a agenda cheia,
// uma semana só acabava antes de o motorista enxergar a próxima.
const SLIDER_DAYS = 14;
// Janela que a Home carrega do banco: o suficiente para a faixa, as notificações e o que ficou para trás.
const AHEAD_DAYS = 30;

// Home: título editorial, dias e a pilha de cartões das viagens do dia. A tela rola; puxar um cartão é segurar e arrastar.
// Ao abrir o app, pergunta sobre viagens que passaram do horário sem conclusão.
export default function Home() {
  const params = useLocalSearchParams<{ trip?: string; day?: string }>();
  const now = useNow();
  const clock = useNow('minute');
  const { notifications } = useProfile();
  const { uid, name, slug } = useDriver();
  const focused = useIsFocused();
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

  // A janela carregada vai de uma semana atrás (viagens esquecidas) a um mês à frente.
  const from = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate() - FORGOTTEN_LOOKBACK_DAYS), [now]);
  const to = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate() + AHEAD_DAYS), [now]);
  const { days: allDays, agendas, paid, loading, error } = useDays(uid, from, to);

  // A Home dá a visão das próximas duas semanas, não do mês.
  const days = allDays.filter((day) => day.date >= startOfDay(now)).slice(0, SLIDER_DAYS);
  const selectedDay = allDays.find((day) => isSameDay(day.date, selected));

  // Ordem de embarque: quem vem primeiro fica no topo; concluídas e canceladas vão para o fim.
  const trips = [...(selectedDay?.trips ?? [])].sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)) || a.time.localeCompare(b.time));
  // Hoje, Amanhã e Ontem ficam no tamanho grande; datas ("Domingo, 20/09") descem um tamanho para caber numa linha.
  const dayTitle = weekdayTitle(selected, now);
  const openTrip = open ? (trips.find((t) => t.id === open.id) ?? null) : null;
  // Ganho do dia: só viagens concluídas. Dia futuro ainda não tem ganho.
  const earned = trips.filter((t) => t.status === 'completed').reduce((sum, t) => sum + t.priceCents, 0);
  const future = startOfDay(selected) > startOfDay(now);

  const actions = useTripActions({ date: selected, close: () => setOpen(null), agendas, paid, slug });

  const forgotten: ForgottenTrip[] = allDays
    .filter((day) => day.date >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - FORGOTTEN_LOOKBACK_DAYS))
    .flatMap((day) => day.trips.filter((trip) => isForgotten(day.date, trip, clock)).map((trip) => ({ date: day.date, trip })));

  const ahead = new Date(now.getFullYear(), now.getMonth(), now.getDate() + NOTIFY_AHEAD_DAYS);
  useTripNotifications(
    allDays.filter((day) => day.date >= startOfDay(now) && day.date <= ahead).flatMap((day) => day.trips.map((trip) => ({ date: day.date, trip }))),
    notifications,
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

  if (loading || error) {
    return <ScreenStatus state={error ? 'error' : 'loading'} layout="home" onRetry={() => router.replace('/')} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title={`Olá, ${name.split(' ')[0] || 'motorista'}`} />

        <View style={styles.title}>
          <Text variant="display">{dayTitle}</Text>
          <Text variant="display" tone="secondary">
            {trips.length === 1 ? '1 viagem' : `${trips.length} viagens`}
          </Text>
          <Text variant="bodyMedium" tone="secondary" style={styles.total}>
            {/* Zero reais no dia de hoje, às seis da manhã, com dez viagens pela frente, lê como
                fracasso em vez de "ainda não começou". Enquanto nada foi concluído, a frase é a
                mesma dos dias futuros. */}
            {trips.length === 0
              ? 'Dia livre'
              : future || earned === 0
                ? 'Os ganhos entram quando você concluir as viagens'
                : `${formatPrice(earned)} ganhos no dia`}
          </Text>
        </View>

        <DaySlider days={days} selected={selected} today={now} onSelect={setSelected} />

        {trips.length > 0 ? (
          <TripStack trips={trips} onOpen={(trip, color, origin) => setOpen({ id: trip.id, color, origin })} />
        ) : (
          <EmptyState
            art="viagens"
            title="Nenhuma viagem neste dia."
            text={
              agendas.length === 0
                ? 'Mande seu link para quem já anda com você: os pedidos chegam aqui.'
                : 'Seus passageiros podem pedir pelo seu link a qualquer momento.'
            }
            {...(agendas.length === 0
              ? // Quem nunca mandou o link está lendo a única instrução que importa. Mandar essa
                // pessoa procurar o caminho no Perfil é perdê-la no primeiro dia.
                { action: { label: 'Ver meu link', icon: 'link' as const, onPress: () => router.push('/link') } }
              : {})}
          />
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
        paidByPassenger={actions.isReported()}
        onPaid={actions.setPaid}
        onSetup={actions.openSetup}
      />

      <ForgottenTripsDialog
        items={focused && !open && !askLater ? forgotten : []}
        now={now}
        onComplete={({ trip }) => actions.setStatus(trip, 'completed')}
        onDidNotHappen={({ trip }) => actions.setStatus(trip, 'cancelled')}
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
});
