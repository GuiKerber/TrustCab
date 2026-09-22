import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, CardStack, colors, layout, PassengerCardContent, Pills, ScreenStatus, size, spacing, Text } from '@trustcab/ui';
import { TopBar } from '@/components/TopBar';
import { formatPrice, longDate, monthName, relativeDay, sampleHistory, sampleMonthDays, samplePassengers, sampleTripRequests, startOfDay, useNow, useSyncState } from '@trustcab/core';
import { passengerMonths, pendingRequests, usePassengerStore, withApprovedTrips, withState, type PassengerWithState } from '@/data/passengers';
import { useTripSignals } from '@/data/tripSignals';

type Tab = 'active' | 'pending' | 'ended';

const capitalize = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

// Passageiros: convite no topo e três pilhas separadas. Ativos: quem aceitou seu convite
// (sem viagens marcadas aparece como inativo, mas continua na rede). Pendentes: convites sem resposta.
// Encerrados: quem você tirou da rede; dá para reativar pela página da pessoa.
export default function Passengers() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const now = useNow();
  const base = useMemo(() => samplePassengers(now), [now]);
  const history = useMemo(() => sampleHistory(now), [now]);
  const requests = useMemo(() => sampleTripRequests(now), [now]);
  const store = usePassengerStore();
  const signals = useTripSignals();
  const sync = useSyncState();
  const [tab, setTab] = useState<Tab>('active');

  // Quem volta do convite cai direto nos pendentes.
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const all = withState(base, store);
  const active = all.filter((p) => p.state === 'active');
  const pending = all.filter((p) => p.state === 'invited');
  const ended = all.filter((p) => p.state === 'ended');

  // Quem tem viagem marcada de hoje até o fim do mês que vem. Sem nenhuma, o passageiro está inativo.
  const scheduled = useMemo(() => {
    const today = startOfDay(now);
    const months = [0, 1].map((step) => withApprovedTrips(sampleMonthDays(new Date(now.getFullYear(), now.getMonth() + step, 1), now), requests, store));
    return new Set(
      months
        .flat()
        .filter((day) => day.date >= today)
        .flatMap((day) => day.trips)
        .filter((trip) => (signals[trip.id] ?? trip.status) !== 'cancelled')
        .map((trip) => trip.passenger),
    );
  }, [now, requests, store, signals]);
  const waiting = pendingRequests(requests, store);
  const month = capitalize(monthName(now));

  const open = (passenger: PassengerWithState) => router.push({ pathname: '/passenger/[id]', params: { id: passenger.id } });

  const summary = (passenger: PassengerWithState) => {
    const spend = passengerMonths(passenger.name, history, signals).at(-1);
    const asking = waiting.filter((request) => request.passengerId === passenger.id).length;
    const trips = spend?.trips ?? 0;
    const tripsText = trips === 1 ? '1 viagem' : `${trips} viagens`;
    const askingText = asking === 1 ? '1 viagem para aprovar' : `${asking} viagens para aprovar`;
    const inactive = !scheduled.has(passenger.name);
    return { trips, total: spend?.totalCents ?? 0, subtitle: asking > 0 ? askingText : inactive ? `${tripsText} · sem viagens marcadas` : tripsText };
  };

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="list" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Passageiros" />

        <View style={styles.invite}>
          <Text variant="display">Sua rede</Text>
          <Text variant="display" tone="secondary">
            de confiança
          </Text>
          <Text variant="body" tone="secondary" style={styles.inviteText}>
            Convide quem já anda com você. A pessoa entra pelo seu link e pede as viagens; você aprova uma por uma.
          </Text>
          <Button label="Convidar passageiro" icon="person_add" variant="light" onPress={() => router.push('/invite')} style={styles.inviteButton} />
        </View>

        <Pills
          items={[
            { key: 'active', label: `Ativos · ${active.length}`, accessibilityLabel: `Ativos, ${active.length}` },
            { key: 'pending', label: `Pendentes · ${pending.length}`, accessibilityLabel: `Pendentes, ${pending.length}` },
            { key: 'ended', label: `Encerrados · ${ended.length}`, accessibilityLabel: `Encerrados, ${ended.length}` },
          ]}
          selected={tab}
          onSelect={(key) => setTab(key as Tab)}
          accessibilityLabel="Tipo de passageiro"
        />

        {tab === 'active' ? (
          active.length > 0 ? (
            <CardStack
              items={active}
              sizes={size.passengerStack}
              keyOf={(p) => p.id}
              colorOf={(_, index) => colors.cards[index % colors.cards.length]}
              accessibilityLabelOf={(p) => {
                const s = summary(p);
                return `${p.name}: ${s.subtitle}. ${formatPrice(s.total)} em ${month}`;
              }}
              accessibilityHint="Abre a página do passageiro. Também dá para segurar o cartão e arrastar para cima."
              onOpen={(p) => open(p)}
              renderCard={(p, { dark }) => {
                const s = summary(p);
                return <PassengerCardContent name={p.name} dark={dark} subtitle={s.subtitle} month={{ label: month, totalCents: s.total }} />;
              }}
            />
          ) : (
            <Empty title="Nenhum passageiro ativo." text="Quem aceitar seu convite aparece aqui." />
          )
        ) : tab === 'pending' ? (
          pending.length > 0 ? (
          <CardStack
            items={pending}
            sizes={size.passengerStack}
            keyOf={(p) => p.id}
            colorOf={() => colors.cardDone}
            accessibilityLabelOf={(p) => `${p.name}: convite enviado ${relativeDay(p.since, now).toLowerCase()}`}
            accessibilityHint="Abre a página do convite"
            onOpen={(p) => open(p)}
            renderCard={(p, { dark }) => (
              <PassengerCardContent name={p.name} dark={dark} subtitle={`Convite enviado · ${relativeDay(p.since, now).toLowerCase()}`} />
            )}
          />
        ) : (
          <Empty title="Nenhum convite esperando resposta." text="Os convites que você mandar e ainda não forem aceitos aparecem aqui." />
          )
        ) : ended.length > 0 ? (
          <CardStack
            items={ended}
            sizes={size.passengerStack}
            keyOf={(p) => p.id}
            colorOf={() => colors.cardDone}
            accessibilityLabelOf={(p) => `${p.name}: conexão encerrada`}
            accessibilityHint="Abre a página da pessoa, onde dá para reativar a conexão"
            onOpen={(p) => open(p)}
            renderCard={(p, { dark }) => (
              <PassengerCardContent name={p.name} dark={dark} subtitle={`Na sua rede desde ${longDate(p.since)} · encerrado`} />
            )}
          />
        ) : (
          <Empty title="Nenhuma conexão encerrada." text="Quem você tirar da sua rede aparece aqui, com o histórico, e pode ser reativado." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text variant="heading" tone="secondary">
        {title}
      </Text>
      <Text variant="small" tone="secondary">
        {text}
      </Text>
    </View>
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
  invite: { paddingHorizontal: spacing[4], paddingTop: spacing[28], paddingBottom: spacing[20] },
  inviteText: { marginTop: spacing[12] },
  inviteButton: { marginTop: spacing[20], alignSelf: 'flex-start' },
  empty: { paddingTop: spacing[20], paddingHorizontal: spacing[4], gap: spacing[8] },
});
