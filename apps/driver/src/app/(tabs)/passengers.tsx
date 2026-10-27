import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardStack, colors, EmptyState, Icon, layout, PassengerCardContent, Pills, ScreenStatus, size, spacing, Text } from '@trustcab/ui';
import { TopBar } from '@/components/TopBar';
import { formatPrice, longDate, monthName, relativeDay, sampleHistory, sampleMonthDays, samplePassengers, sampleTripRequests, startOfDay, useNow, useSyncState } from '@trustcab/core';
import { passengerMonths, pendingRequests, usePassengerStore, withApprovedTrips, withState, type PassengerWithState } from '@/data/passengers';
import { useTripSignals } from '@/data/tripSignals';
import { canInvite, FREE_PASSENGERS, seatsLeft } from '@/data/plan';
import { useProfile } from '@/data/profile';
import { useNetwork } from '@/data/network';
import { useAuth } from '@trustcab/core/auth';

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
  const profile = useProfile();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('active');

  // Quem volta do convite cai direto nos pendentes.
  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  // Com conta, a rede vem do Firestore e é a mesma que o passageiro está vendo do outro lado.
  // Sem conta (demonstração), continuam os exemplos locais.
  const rede = useNetwork(user?.uid ?? null);
  const all = rede.connected ? rede.passengers : withState(base, store);
  // O limite do plano grátis conta quem está na rede mais os convites em aberto.
  const used = all.filter((p) => p.state === 'active' || p.state === 'invited').length;
  const livre = canInvite(profile.plan, used);
  // Sem vaga, convidar leva para o plano em vez de abrir o convite e falhar depois.
  const convidar = () => router.push(livre ? '/invite' : '/plan');
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
        <TopBar title="Passageiros" action={{ icon: 'person_add', label: 'Convidar passageiro', onPress: convidar }} />

        <View style={styles.invite}>
          <Text variant="display">Sua rede</Text>
          <Text variant="display" tone="secondary">
            de confiança
          </Text>
          <Text variant="body" tone="secondary" style={styles.inviteText}>
            Convide quem já anda com você. A pessoa entra pelo seu link e pede as viagens; você aprova uma por uma.
          </Text>
          {/* O limite só aparece quando chega perto de doer. Antes disso é ruído. */}
          {profile.plan === 'free' && used >= FREE_PASSENGERS - 1 ? (
            <Pressable onPress={() => router.push('/plan')} accessibilityRole="button" accessibilityLabel={`${used} de ${FREE_PASSENGERS} passageiros no plano grátis. Ver planos.`} style={styles.seats}>
              <Icon name={livre ? 'info' : 'lock'} size={size.icon.sm} color={colors.orange} />
              <Text variant="small" tone="orange" style={styles.seatsText}>
                {livre
                  ? `${used} de ${FREE_PASSENGERS} passageiros do plano grátis. Resta ${seatsLeft(profile.plan, used)}.`
                  : `Plano grátis cheio: ${FREE_PASSENGERS} passageiros. Assine para convidar mais.`}
              </Text>
              <Icon name="chevron_right" size={size.icon.sm} color={colors.orange} />
            </Pressable>
          ) : null}
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
            <EmptyState icon="group" title="Ninguém na sua rede ainda" text="Convide quem já anda com você. A pessoa entra pelo seu link e começa a pedir viagens." action={{ label: 'Convidar passageiro', icon: 'person_add', onPress: convidar }} />
          )
        ) : tab === 'pending' ? (
          pending.length > 0 ? (
          <CardStack
            items={pending}
            sizes={size.passengerStack}
            keyOf={(p) => p.id}
            colorOf={() => colors.cardDone}
            accessibilityLabelOf={(p) => `${p.name}: ${p.asked ? 'pediu para entrar' : 'convite enviado'} ${relativeDay(p.since, now).toLowerCase()}`}
            accessibilityHint="Abre a página do convite"
            onOpen={(p) => open(p)}
            renderCard={(p, { dark }) => (
              <PassengerCardContent name={p.name} dark={dark} subtitle={`${p.asked ? 'Pediu para entrar' : 'Convite enviado'} · ${relativeDay(p.since, now).toLowerCase()}`} />
            )}
          />
        ) : (
          <EmptyState icon="mail" title="Nenhum convite esperando" text="Os convites que você mandar aparecem aqui até a pessoa aceitar." action={{ label: 'Convidar passageiro', icon: 'person_add', onPress: convidar }} />
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
          <EmptyState icon="person_off" title="Nenhuma conexão encerrada" text="Quem você tirar da rede fica aqui com o histórico, e dá para reativar quando quiser." />
        )}
      </ScrollView>
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
  invite: { paddingHorizontal: spacing[4], paddingTop: spacing[28], paddingBottom: spacing[20] },
  inviteText: { marginTop: spacing[12] },
  seats: { marginTop: spacing[16], flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  seatsText: { flex: 1 },
});
