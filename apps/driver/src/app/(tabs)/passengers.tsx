import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardStack, colors, EmptyState, layout, PassengerCardContent, Pills, ScreenStatus, size, spacing, Text } from '@trustcab/ui';
import { TopBar } from '@/components/TopBar';
import { formatPrice, longDate, monthName, startOfDay, useNow } from '@trustcab/core';
import { useRequests } from '@trustcab/core/db';
import { useDays } from '@/data/days';
import { useDriver } from '@/data/driver';
import { useNetwork, type Contact } from '@/data/network';

type Tab = 'active' | 'archived';

const capitalize = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`;

// Passageiros: quem anda com você. Ativos e arquivados — não existe mais "pendente", porque
// ninguém mais espera aprovação para ser passageiro; o que você aprova é o pedido de agenda,
// e isso tem tela própria.
export default function Passengers() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const now = useNow();
  const { uid } = useDriver();
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    if (params.tab) setTab(params.tab);
  }, [params.tab]);

  const rede = useNetwork(uid);
  const requests = useRequests(uid);

  // O mês corrente inteiro: é dele que sai o total de cada pessoa e a resposta para "tem viagem
  // marcada daqui para frente?".
  const from = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), [now]);
  const to = useMemo(() => new Date(now.getFullYear(), now.getMonth() + 2, 0), [now]);
  const { days, paid, loading, error } = useDays(uid, from, to);

  const mesAtual = days.filter((day) => day.date.getMonth() === now.getMonth());
  const marcadas = useMemo(() => {
    const hoje = startOfDay(now);
    return new Set(
      days
        .filter((day) => day.date >= hoje)
        .flatMap((day) => day.trips)
        .filter((trip) => trip.status !== 'cancelled')
        .map((trip) => trip.passengerId),
    );
  }, [days, now]);

  const active = rede.passengers.filter((p) => p.state === 'active');
  const archived = rede.passengers.filter((p) => p.state === 'archived');
  const month = capitalize(monthName(now));
  const abrir = () => router.push('/link');

  const summary = (passenger: Contact) => {
    const concluidas = mesAtual
      .flatMap((day) => day.trips)
      .filter((trip) => trip.passengerId === passenger.id && trip.status === 'completed');
    const total = concluidas.reduce((soma, trip) => soma + trip.priceCents, 0);
    const pendentes = requests.data.filter((r) => r.passengerId === passenger.id).length;

    const viagens = concluidas.length === 1 ? '1 viagem' : `${concluidas.length} viagens`;
    const pedidos = pendentes === 1 ? '1 pedido esperando você' : `${pendentes} pedidos esperando você`;
    const semMarcada = !marcadas.has(passenger.id);

    return {
      total,
      // O que ele precisa saber primeiro: alguém esperando resposta ganha de qualquer número.
      subtitle: pendentes > 0 ? pedidos : semMarcada ? `${viagens} · sem viagem marcada` : viagens,
      // Quem já recebeu tudo do mês não precisa aparecer como cobrança em aberto.
      quitado: concluidas.length > 0 && concluidas.every((trip) => paid.has(trip.id)),
    };
  };

  const open = (passenger: Contact) => router.push({ pathname: '/passenger/[id]', params: { id: passenger.id } });

  if (rede.loading || loading || rede.error || error) {
    return (
      <ScreenStatus
        state={rede.error || error ? 'error' : 'loading'}
        layout="list"
        onRetry={() => router.replace('/passengers')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Passageiros" action={{ icon: 'link', label: 'Ver meu link', onPress: abrir }} />

        <View style={styles.invite}>
          <Text variant="display">Sua rede</Text>
          <Text variant="display" tone="secondary">
            de confiança
          </Text>
          <Text variant="body" tone="secondary" style={styles.inviteText}>
            Mande seu link para quem já anda com você. A pessoa escolhe o dia e o horário, e você confirma.
          </Text>
        </View>

        <Pills
          items={[
            { key: 'active', label: `Ativos · ${active.length}`, accessibilityLabel: `Ativos, ${active.length}` },
            { key: 'archived', label: `Arquivados · ${archived.length}`, accessibilityLabel: `Arquivados, ${archived.length}` },
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
            <EmptyState
              art="passageiros"
              title="Ninguém na sua rede ainda"
              text="Quem marcar pelo seu link entra aqui sozinho, com nome e WhatsApp."
              action={{ label: 'Ver meu link', icon: 'link', onPress: abrir }}
            />
          )
        ) : archived.length > 0 ? (
          <CardStack
            items={archived}
            sizes={size.passengerStack}
            keyOf={(p) => p.id}
            colorOf={() => colors.cardDone}
            accessibilityLabelOf={(p) => `${p.name}: arquivado`}
            accessibilityHint="Abre a página da pessoa, onde dá para tirar do arquivo"
            onOpen={(p) => open(p)}
            renderCard={(p, { dark }) => (
              <PassengerCardContent name={p.name} dark={dark} subtitle={`Na sua rede desde ${longDate(p.since)} · arquivado`} />
            )}
          />
        ) : (
          <EmptyState
            art="passageiros"
            title="Ninguém arquivado"
            text="Quem você arquivar sai da lista e fica aqui com o histórico. Dá para tirar do arquivo quando quiser."
          />
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
});
