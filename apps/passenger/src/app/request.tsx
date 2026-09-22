import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';

import { formatPrice, maskMoney, maskTime, moneyToCents, shortDate, timeError, useNow } from '@trustcab/core';
import { Banner, Block, borderWidth, Button, Checkbox, colors, FormScreen, IconButton, Label, radius, spacing, Text, TextField } from '@trustcab/ui';

import { myDriver, useConnections } from '@/data/connections';
import { addRoutine, datesOfRoutineTrip } from '@/data/routines';

// Ordem da semana de quem trabalha: segunda primeiro.
const WEEKDAYS = [
  { day: 1, name: 'segunda', every: 'toda segunda' },
  { day: 2, name: 'terça', every: 'toda terça' },
  { day: 3, name: 'quarta', every: 'toda quarta' },
  { day: 4, name: 'quinta', every: 'toda quinta' },
  { day: 5, name: 'sexta', every: 'toda sexta' },
  { day: 6, name: 'sábado', every: 'todo sábado' },
  { day: 0, name: 'domingo', every: 'todo domingo' },
];

// Depois do último dia vem a revisão.
const REVIEW = WEEKDAYS.length;

// Tempo estimado usado até o backend calcular pelo Google Maps.
const DEFAULT_ETA_MINUTES = 20;

type Draft = { id: string; time: string; origin: string; destination: string; price: string; recurring: boolean };
type DraftErrors = Partial<Record<'time' | 'origin' | 'destination' | 'price', string>>;

function capitalize(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

function draftErrors(draft: Draft): DraftErrors | null {
  const e: DraftErrors = {
    time: timeError(draft.time) ?? undefined,
    origin: draft.origin.trim() ? undefined : 'Escreva de onde você sai.',
    destination: draft.destination.trim() ? undefined : 'Escreva para onde você vai.',
    price: moneyToCents(draft.price) > 0 ? undefined : 'Escreva quanto você propõe pagar, como R$ 25,00.',
  };
  return Object.values(e).some(Boolean) ? e : null;
}

// Pedir viagens: uma tela por dia da semana, de segunda a domingo, e no fim a revisão.
// Cada dia tem as viagens dele (ex.: 08:00 para o trabalho, 17:00 de volta para casa). Cada data vira um pedido
// que o motorista aprova ou recusa sozinho.
export default function RequestTrips() {
  const now = useNow();
  const driver = myDriver(useConnections(), now);
  const [step, setStep] = useState(0);
  // De qual dia você foi para a revisão: o voltar da revisão leva de volta para ele.
  const [reviewFrom, setReviewFrom] = useState(REVIEW - 1);
  const [drafts, setDrafts] = useState<Record<number, Draft[]>>({});
  const [errors, setErrors] = useState<Record<string, DraftErrors>>({});
  const [emptyError, setEmptyError] = useState(false);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState<number | null>(null);

  const first = driver?.name.split(' ')[0] ?? 'o motorista';
  const dayInfo = WEEKDAYS[Math.min(step, REVIEW - 1)];
  const list = drafts[dayInfo.day] ?? [];
  const filled = WEEKDAYS.flatMap((w) => (drafts[w.day] ?? []).map((draft) => ({ weekday: w.day, draft })));
  const requests = filled.flatMap(({ weekday, draft }) => datesOfRoutineTrip({ weekday, recurring: draft.recurring }, now).map(() => draft));
  const total = requests.reduce((sum, draft) => sum + moneyToCents(draft.price), 0);

  const back = () => {
    if (step === REVIEW) setStep(reviewFrom);
    else if (step > 0) setStep(step - 1);
    else router.back();
  };

  // No Android, o voltar do sistema também volta um dia.
  useEffect(() => {
    if (Platform.OS !== 'android' || sent != null || step === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  });

  const setDayDrafts = (next: Draft[]) => setDrafts({ ...drafts, [dayInfo.day]: next });

  // A viagem seguinte do dia já vem com os endereços invertidos e o mesmo valor (a volta), para ajustar se precisar.
  const addTrip = () => {
    const last = list.at(-1);
    setDayDrafts([
      ...list,
      { id: `${dayInfo.day}-${Date.now()}`, time: '', origin: last?.destination ?? '', destination: last?.origin ?? '', price: last?.price ?? '', recurring: true },
    ]);
    setEmptyError(false);
  };

  const update = (id: string, field: keyof DraftErrors, value: string) => {
    setDayDrafts(list.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
    if (errors[id]?.[field]) setErrors({ ...errors, [id]: { ...errors[id], [field]: undefined } });
  };

  const setRecurring = (weekday: number, id: string, recurring: boolean) =>
    setDrafts({ ...drafts, [weekday]: (drafts[weekday] ?? []).map((d) => (d.id === id ? { ...d, recurring } : d)) });

  const remove = (id: string) => setDayDrafts(list.filter((d) => d.id !== id));

  // Só sai do dia com as viagens dele completas.
  const dayIsValid = () => {
    const next = { ...errors };
    let valid = true;
    for (const draft of list) {
      const e = draftErrors(draft);
      if (e) valid = false;
      if (e) next[draft.id] = e;
      else delete next[draft.id];
    }
    setErrors(next);
    return valid;
  };

  const goNext = () => {
    if (!dayIsValid()) return;
    setStep(step + 1);
  };

  const finish = () => {
    if (!dayIsValid()) return;
    if (filled.length === 0) {
      setEmptyError(true);
      return;
    }
    setReviewFrom(step);
    setStep(REVIEW);
  };

  const send = () => {
    if (!driver || filled.length === 0) return;
    addRoutine({
      driverId: driver.id,
      driverName: driver.name,
      trips: filled.map(({ weekday, draft }) => ({
        weekday,
        time: draft.time,
        origin: draft.origin.trim(),
        destination: draft.destination.trim(),
        priceCents: moneyToCents(draft.price),
        recurring: draft.recurring,
      })),
      etaMinutes: DEFAULT_ETA_MINUTES,
      note: note.trim(),
    });
    setSent(requests.length);
  };

  if (sent != null) {
    return (
      <FormScreen
        backLabel="Voltar para o início"
        onBack={() => router.back()}
        footer={<Button label="Ver na agenda" icon="calendar_month" variant="light" onPress={() => router.navigate('/agenda')} />}>
        <View style={styles.head}>
          <Text variant="display">Pedido</Text>
          <Text variant="display" tone="secondary">
            enviado
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            {`${sent === 1 ? '1 viagem espera' : `${sent} viagens esperam`} ${first} aprovar. Você recebe um aviso a cada resposta; até lá, elas aparecem como "Esperando o motorista".`}
          </Text>
        </View>
      </FormScreen>
    );
  }

  if (step === REVIEW) {
    const days = WEEKDAYS.filter((w) => (drafts[w.day] ?? []).length > 0);
    return (
      <FormScreen
        key="review"
        backLabel={`Voltar para ${WEEKDAYS[reviewFrom].name}`}
        onBack={back}
        footer={
          <Button
            label={driver ? `Enviar pedido para ${first}` : 'Enviar pedido'}
            icon="send"
            variant="light"
            onPress={send}
            disabled={!driver}
            accessibilityHint="Cada viagem vai para a aprovação do motorista"
          />
        }>
        <View style={styles.head}>
          <Text variant="display">Sua</Text>
          <Text variant="display" tone="secondary">
            semana
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            Confira cada viagem. Marque recorrente para repetir toda semana; sem marcar, ela vale só para a próxima data.
          </Text>
        </View>

        {days.map((w) => {
          const index = WEEKDAYS.indexOf(w);
          return (
            <View key={w.day} style={styles.field}>
              <View style={styles.tripHead}>
                <Text variant="title">{capitalize(w.name)}</Text>
                <Button label="Editar" icon="edit" size="sm" variant="ghost" onPress={() => setStep(index)} accessibilityHint={`Volta para as viagens de ${w.name}`} />
              </View>
              {(drafts[w.day] ?? []).map((draft) => {
                const next = datesOfRoutineTrip({ weekday: w.day, recurring: false }, now)[0];
                return (
                  <Block key={draft.id} style={styles.reviewTrip}>
                    <View style={styles.tripHead}>
                      <Text variant="heading">{draft.time}</Text>
                      <Text variant="bodyMedium">{draft.price}</Text>
                    </View>
                    <Text variant="small" tone="secondary">
                      {`${draft.origin.trim()} → ${draft.destination.trim()}`}
                    </Text>
                    <Checkbox
                      label="Recorrente"
                      hint={draft.recurring ? `Repete ${w.every}, até você parar.` : `Só no dia ${next ? shortDate(next) : 'da próxima'}.`}
                      checked={draft.recurring}
                      onChange={(value) => setRecurring(w.day, draft.id, value)}
                    />
                  </Block>
                );
              })}
            </View>
          );
        })}

        <TextField label="Recado para o motorista (opcional)" value={note} onChangeText={setNote} placeholder="Ex.: toco o interfone do bloco B" />

        <Block style={styles.summary}>
          <Label>Resumo</Label>
          <Text variant="bodyMedium" accessibilityLiveRegion="polite">
            {`${requests.length === 1 ? '1 viagem' : `${requests.length} viagens`} · ${formatPrice(total)}`}
          </Text>
          <Text variant="small" tone="secondary">
            {filled.some(({ draft }) => draft.recurring)
              ? `Contando até o fim do mês que vem. As recorrentes renovam no começo de cada mês e cada uma vai para ${first} aprovar.`
              : `Cada uma vai para ${first} aprovar.`}
          </Text>
        </Block>
      </FormScreen>
    );
  }

  const isLast = step === REVIEW - 1;
  const nextDay = WEEKDAYS[step + 1];

  return (
    <FormScreen
      key={step}
      backLabel={step === 0 ? 'Sair sem pedir' : `Voltar para ${WEEKDAYS[step - 1].name}`}
      onBack={back}
      footer={
        <View style={styles.actions}>
          {isLast ? null : (
            <Button label="Continuar" variant="surface" onPress={goNext} accessibilityHint={`Vai para ${nextDay.name}`} style={styles.grow} />
          )}
          <Button label="Finalizar" variant="light" onPress={finish} accessibilityHint="Mostra a semana para você revisar e enviar" style={styles.grow} />
        </View>
      }>
      <View style={styles.head}>
        <Text variant="display">Pedir</Text>
        <Text variant="display" tone="secondary">
          viagens
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          {`Monte sua semana dia por dia. Cada viagem vai para ${first} aprovar, uma por uma.`}
        </Text>
      </View>

      <View style={styles.field}>
        <View>
          <Label>{`Dia ${step + 1} de ${REVIEW}`}</Label>
          <Text variant="title" accessibilityRole="header">
            {capitalize(dayInfo.name)}
          </Text>
        </View>

        {list.map((draft, index) => {
          const e = errors[draft.id] ?? {};
          return (
            <View key={draft.id} style={styles.trip}>
              <View style={styles.tripHead}>
                <Label>{`Viagem ${index + 1}`}</Label>
                <IconButton name="delete" size="sm" label={`Remover viagem ${index + 1} de ${dayInfo.name}`} onPress={() => remove(draft.id)} />
              </View>
              <TextField
                label="Horário de saída"
                value={draft.time}
                onChangeText={(value) => update(draft.id, 'time', maskTime(value))}
                placeholder={index === 0 ? '08:00' : '17:00'}
                keyboardType="number-pad"
                error={e.time}
              />
              <TextField label="Partida" value={draft.origin} onChangeText={(value) => update(draft.id, 'origin', value)} placeholder="Rua, número e bairro" autoCapitalize="words" error={e.origin} />
              <TextField
                label="Destino"
                value={draft.destination}
                onChangeText={(value) => update(draft.id, 'destination', value)}
                placeholder="Rua, número e bairro"
                autoCapitalize="words"
                error={e.destination}
              />
              <TextField
                label="Valor que você propõe"
                value={draft.price}
                onChangeText={(value) => update(draft.id, 'price', maskMoney(value))}
                placeholder="R$ 25,00"
                keyboardType="number-pad"
                error={e.price}
              />
            </View>
          );
        })}

        <Button label="Adicionar viagem" icon="add" variant="surface" onPress={addTrip} accessibilityHint={`Adiciona uma viagem na ${dayInfo.name}`} />
        {list.length > 0 ? (
          <Text variant="small" tone="secondary">
            A próxima viagem do dia já vem com os endereços invertidos, para a volta. Mude se precisar.
          </Text>
        ) : null}
      </View>

      {emptyError ? (
        <Banner icon="error" tone="warning" title="Adicione pelo menos uma viagem" text="Toque em Adicionar viagem em algum dia antes de finalizar." />
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  field: { gap: spacing[8] },
  // Contorno em vez de fundo: os campos já têm o fundo "surface" e sumiriam dentro de um bloco.
  trip: { gap: spacing[12], padding: spacing[16], borderRadius: radius.block, borderWidth: borderWidth.hairline, borderColor: colors.lineStrong },
  tripHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  reviewTrip: { gap: spacing[8] },
  summary: { gap: spacing[4] },
  actions: { flexDirection: 'row', gap: spacing[8] },
  grow: { flex: 1 },
});
