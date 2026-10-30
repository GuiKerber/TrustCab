import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  agendaConfirmed,
  agendaDeclined,
  formatPhone,
  formatPrice,
  maskMoney,
  moneyToCents,
  routeLabel,
  whenLabel,
} from '@trustcab/core';
import { answerRequest, useRequests, type AgendaDoc } from '@trustcab/core/db';
import {
  Block,
  Button,
  colors,
  EmptyState,
  FormScreen,
  Label,
  layout,
  ScreenStatus,
  spacing,
  Text,
  TextField,
} from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { sendTo } from '@/data/whatsapp';
import { goBack } from '@/lib/back';

type Agenda = AgendaDoc & { id: string };
type Answered = { agenda: Agenda; status: 'confirmed' | 'declined'; price: number | null };

// A caixa de pedidos. Tudo o que entrou pelo link e ainda espera resposta.
//
// Responder não fecha o assunto: o passageiro não tem app e não fica sabendo de nada até alguém
// escrever para ele. Por isso o cartão não some quando é respondido — ele vira o aviso, com a
// mensagem pronta. É o passo que o produto inteiro depende de não ser esquecido.
export default function Requests() {
  const { uid, name, slug } = useDriver();
  const { data, loading, error } = useRequests(uid);
  const [answered, setAnswered] = useState<Record<string, Answered>>({});

  if (loading || error) {
    return <ScreenStatus state={error ? 'error' : 'loading'} layout="list" onRetry={() => router.replace('/requests')} />;
  }

  const waiting = data.filter((agenda) => !answered[agenda.id]);
  const done = Object.values(answered);

  return (
    <FormScreen backLabel="Voltar" onBack={() => goBack('/')}>
      <View style={styles.head}>
        <Text variant="display">Pedidos</Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {waiting.length === 0
            ? 'Nada esperando você agora.'
            : waiting.length === 1
              ? '1 pessoa esperando sua resposta.'
              : `${waiting.length} pessoas esperando sua resposta.`}
        </Text>
      </View>

      {waiting.length === 0 && done.length === 0 ? (
        <EmptyState
          art="pedidos"
          title="Nenhum pedido ainda"
          text="Quando alguém marcar pelo seu link, o pedido aparece aqui e seu celular avisa."
          action={{ label: 'Ver meu link', icon: 'link', onPress: () => router.push('/link') }}
        />
      ) : null}

      {waiting.map((agenda) => (
        <RequestCard
          key={agenda.id}
          agenda={agenda}
          onAnswered={(status, price) => setAnswered((all) => ({ ...all, [agenda.id]: { agenda, status, price } }))}
        />
      ))}

      {done.map(({ agenda, status, price }) => (
        <AnsweredCard key={agenda.id} agenda={agenda} status={status} price={price} driverName={name} slug={slug} />
      ))}
    </FormScreen>
  );
}

// ─── O pedido esperando resposta ─────────────────────────────────────────────

function RequestCard({ agenda, onAnswered }: { agenda: Agenda; onAnswered: (status: 'confirmed' | 'declined', price: number | null) => void }) {
  const [price, setPrice] = useState('');
  // Qual das duas respostas está salvando: o indicador aparece só no botão tocado.
  const [busy, setBusy] = useState<'confirmed' | 'declined' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const responder = async (status: 'confirmed' | 'declined') => {
    setError(null);
    setBusy(status);
    const cents = status === 'confirmed' && price ? moneyToCents(price) : null;
    try {
      await answerRequest(agenda.id, status, cents);
      onAnswered(status, cents);
    } catch {
      setError('Não deu para salvar a resposta. Confira sua internet e tente de novo.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Block style={styles.card}>
      <View style={styles.who}>
        <Text variant="heading">{agenda.passengerName}</Text>
        <Text variant="small" tone="secondary">
          {formatPhone(agenda.passengerPhone)}
        </Text>
      </View>

      <View style={styles.lines}>
        <Line label="Quando" value={whenLabel(agenda)} />
        <Line label="Trajeto" value={routeLabel(agenda)} />
        {agenda.note ? <Line label="Recado" value={agenda.note} /> : null}
      </View>

      <TextField
        label="Valor por viagem (opcional)"
        value={price}
        onChangeText={(text) => setPrice(maskMoney(text))}
        keyboardType="number-pad"
        placeholder="R$ 0,00"
        hint="Dá para acertar o valor depois, no WhatsApp."
      />

      {error ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Confirmar"
          icon="check"
          variant="light"
          loading={busy === 'confirmed'}
          // Carregando já bloqueia o toque; "disabled" apaga só o outro botão.
          disabled={busy === 'declined'}
          onPress={() => responder('confirmed')}
        />
        <Button
          label="Não consigo"
          icon="close"
          variant="surface"
          loading={busy === 'declined'}
          disabled={busy === 'confirmed'}
          onPress={() => responder('declined')}
        />
      </View>
    </Block>
  );
}

// ─── O pedido já respondido, esperando o aviso ───────────────────────────────

function AnsweredCard({
  agenda,
  status,
  price,
  driverName,
  slug,
}: {
  agenda: Agenda;
  status: 'confirmed' | 'declined';
  price: number | null;
  driverName: string;
  slug: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const firstName = agenda.passengerName.split(' ')[0];

  const texto =
    status === 'confirmed'
      ? agendaConfirmed(firstName, agenda, price != null ? formatPrice(price) : null)
      : agendaDeclined(firstName, agenda, slug ?? '');

  const avisar = async () => {
    setError(null);
    const result = await sendTo(agenda.passengerPhone, texto);
    if (result.ok) setSent(true);
    else setError(result.message);
  };

  return (
    <Block background={colors.surfaceRaised} style={styles.card}>
      <View style={styles.who}>
        <Label>{status === 'confirmed' ? 'Combinado' : 'Recusado'}</Label>
        <Text variant="heading">{agenda.passengerName}</Text>
        <Text variant="small" tone="secondary">
          {whenLabel(agenda)}
        </Text>
      </View>

      <Text variant="body" tone="secondary">
        {status === 'confirmed'
          ? `${firstName} ainda não sabe. Mande o combinado para ele agora.`
          : `Avise ${firstName} e mande o link de novo, para ele escolher outro horário.`}
      </Text>

      {error ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Button
        label={sent ? `Mandar de novo para ${firstName}` : `Avisar ${firstName} no WhatsApp`}
        icon="chat"
        variant={sent ? 'surface' : 'light'}
        onPress={avisar}
      />
    </Block>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Label>{label}</Label>
      <Text variant="body">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: layout.textInset },
  lead: { marginTop: spacing[12] },
  card: { gap: spacing[16] },
  who: { gap: spacing[4] },
  lines: { gap: spacing[12] },
  line: { gap: spacing[4] },
  actions: { gap: spacing[8] },
});
