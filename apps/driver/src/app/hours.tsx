import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { maskTime, minutesOf, slotTimes, timeError, WEEKDAY_SHORT, type Slots } from '@trustcab/core';
import { setSlots } from '@trustcab/core/db';
import { Button, ChipGroup, FormScreen, InfoBlock, Label, PageHeader, Pills, spacing, Text, TextField } from '@trustcab/ui';

import { useDriver } from '@/data/driver';
import { goBack } from '@/lib/back';

const DIAS = WEEKDAY_SHORT.map((label, weekday) => ({ key: String(weekday), label }));
const INTERVALOS = [
  { key: '15', label: '15 min' },
  { key: '30', label: '30 min' },
  { key: '60', label: '1 hora' },
];
const VAGAS = [1, 2, 3, 4, 5, 6].map((n) => ({ key: String(n), label: String(n) }));

// Os horários que a página de agendamento oferece. É o único lugar onde o motorista decide o que
// o passageiro vê — e o campo que mais importa é o de vagas: ele começa em 1, então o segundo
// pedido do mesmo horário aparece como cheio até ele dizer que leva mais gente junto.
export default function Hours() {
  const { uid, slots } = useDriver();
  const [weekdays, setWeekdays] = useState<string[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [step, setStep] = useState('30');
  const [seats, setSeats] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [carregado, setCarregado] = useState(false);

  // O que está salvo entra uma vez; depois disso quem manda é o que a pessoa está editando.
  useEffect(() => {
    if (carregado) return;
    setWeekdays(slots.weekdays.map(String));
    setFrom(slots.from);
    setTo(slots.to);
    setStep(String(slots.stepMinutes));
    setSeats(String(slots.seats));
    setCarregado(true);
  }, [slots, carregado]);

  const fromError = from ? timeError(from) : 'Escreva a hora de começar.';
  const toError = to ? timeError(to) : 'Escreva a hora de parar.';
  const ordem = !fromError && !toError && minutesOf(from) >= minutesOf(to) ? 'A hora de parar tem que ser depois da de começar.' : null;

  const atual: Slots = {
    weekdays: weekdays.map(Number).sort(),
    from,
    to,
    stepMinutes: Number(step),
    seats: Number(seats),
  };
  const quantos = fromError || toError || ordem ? 0 : slotTimes(atual).length;

  const salvar = async () => {
    setError(null);
    if (weekdays.length === 0) return setError('Marque pelo menos um dia da semana.');
    if (fromError || toError || ordem) return setError(ordem ?? fromError ?? toError);
    if (!uid) return setError('Entre na sua conta para salvar.');

    setBusy(true);
    try {
      await setSlots(uid, atual);
      goBack('/profile');
    } catch {
      setError('Não deu para salvar. Confira sua internet e tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormScreen
      backLabel="Voltar"
      onBack={() => goBack('/profile')}
      footer={<Button label="Salvar" icon="check" variant="light" loading={busy} onPress={salvar} />}>
      <PageHeader title="Seus" subtitle="horários" lead="É isto que aparece para quem abre seu link. Fora daqui, ninguém consegue marcar." />

      <View style={styles.section}>
        <Label>Dias em que você roda</Label>
        <ChipGroup
          items={DIAS}
          selected={weekdays}
          onChange={setWeekdays}
          accessibilityLabel="Dias da semana em que você roda"
          error={weekdays.length === 0 ? 'Marque pelo menos um dia.' : undefined}
        />
      </View>

      <View style={styles.section}>
        <Label>Das … às …</Label>
        <View style={styles.row}>
          <View style={styles.half}>
            <TextField
              label="Começa"
              value={from}
              onChangeText={(text) => setFrom(maskTime(text))}
              keyboardType="number-pad"
              placeholder="06:00"
              error={from ? (fromError ?? undefined) : undefined}
            />
          </View>
          <View style={styles.half}>
            <TextField
              label="Para"
              value={to}
              onChangeText={(text) => setTo(maskTime(text))}
              keyboardType="number-pad"
              placeholder="20:00"
              error={to ? (ordem ?? toError ?? undefined) : undefined}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Label>De quanto em quanto tempo</Label>
        <Pills items={INTERVALOS} selected={step} onSelect={setStep} role="radio" accessibilityLabel="Intervalo entre os horários" />
        <Text variant="small" tone="secondary">
          {quantos > 0 ? `${quantos} horários para escolher por dia.` : 'Confira a janela para ver quantos horários sobram.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Label>Quantas pessoas no mesmo horário</Label>
        <Pills items={VAGAS} selected={seats} onSelect={setSeats} role="radio" accessibilityLabel="Pessoas por horário" />
      </View>

      <InfoBlock
        label="Por que isso importa"
        text={
          Number(seats) === 1
            ? 'Com 1 pessoa por horário, o primeiro que marcar as 07:00 fecha esse horário para os outros. Se você leva mais de um junto no mesmo trajeto, aumente aqui.'
            : `Com ${seats} pessoas por horário, as 07:00 só aparecem cheias depois que ${seats} marcarem. Deixe só o que cabe no carro.`
        }
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[8] },
  row: { flexDirection: 'row', gap: spacing[12] },
  half: { flex: 1 },
});
