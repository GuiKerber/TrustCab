import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';

import { Banner, Block, Button, colors, FormScreen, Label, spacing, Text, TextField } from '@trustcab/ui';
import { addInvite, samePhone, usePassengerStore, withState, type PassengerWithState } from '@/data/passengers';
import { inviteMessage, useProfile } from '@/data/profile';
import { driver, formatPhone, longDate, samplePassengers } from '@trustcab/core';

// Convidar passageiro: nome e WhatsApp. O convite sai pelo WhatsApp com o seu link;
// quem aceita entra na sua rede e já pode pedir viagens.
export default function Invite() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; send?: string }>({});
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const phoneRef = useRef<TextInput>(null);
  const store = usePassengerStore();
  // Número que já é de alguém: na rede, com convite esperando ou com a conexão encerrada.
  const [duplicate, setDuplicate] = useState<PassengerWithState | null>(null);

  const firstName = name.trim().split(' ')[0];
  const { inviteToken } = useProfile();
  const message = inviteMessage(firstName, driver.firstName, inviteToken);

  const send = async () => {
    const digits = phone.replace(/\D/g, '');
    const next = {
      name: name.trim().length < 2 ? 'Escreva o nome da pessoa.' : undefined,
      phone: digits.length < 10 ? 'Confira o número: use DDD + celular, como (11) 98765-4321.' : undefined,
    };
    setErrors(next);
    if (next.name || next.phone) return;

    const existing = withState(samplePassengers(new Date()), store).find((p) => p.state !== 'cancelled' && samePhone(p.phone, digits));
    setDuplicate(existing ?? null);
    if (existing) return;

    setSending(true);
    try {
      await Linking.openURL(`https://wa.me/55${digits}?text=${encodeURIComponent(message)}`);
      addInvite({ id: `convite-${Date.now()}`, name: name.trim(), phone: digits, status: 'invited', since: new Date() });
      setSentTo(firstName);
    } catch {
      setErrors({ send: 'Não deu para abrir o WhatsApp. Confira se ele está instalado e tente de novo.' });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setName('');
    setPhone('');
    setErrors({});
    setSentTo(null);
  };

  if (sentTo) {
    return (
      <FormScreen
        backIcon="close"
        backLabel="Fechar"
        onBack={() => router.back()}
        footer={
          <>
            <Button label="Ver pendentes" icon="group" variant="light" onPress={() => router.navigate({ pathname: '/passengers', params: { tab: 'pending' } })} />
            <Button label="Convidar outra pessoa" size="sm" variant="ghost" onPress={reset} style={styles.center} />
          </>
        }>
        <View style={styles.head}>
          <Text variant="display">Convite</Text>
          <Text variant="display" tone="secondary">
            enviado
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            {`${sentTo} está nos seus pendentes. Quando aceitar, passa para Ativos e já pode pedir viagens.`}
          </Text>
        </View>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      backIcon="close"
      backLabel="Fechar"
      onBack={() => router.back()}
      footer={<Button label="Enviar convite pelo WhatsApp" icon="send" variant="light" loading={sending} onPress={send} />}>
      <View style={styles.head}>
        <Text variant="display">Convidar</Text>
        <Text variant="display" tone="secondary">
          passageiro
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          O convite sai pelo WhatsApp com o seu link. Só quem você convidar vê sua agenda.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Nome"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          placeholder="Como você chama a pessoa"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneRef.current?.focus()}
          error={errors.name}
          disabled={sending}
        />
        <TextField
          ref={phoneRef}
          label="Celular com WhatsApp"
          value={phone}
          onChangeText={(value) => {
            setPhone(formatPhone(value));
            setDuplicate(null);
            if (errors.phone) setErrors({ ...errors, phone: undefined });
          }}
          placeholder="(11) 98765-4321"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="send"
          onSubmitEditing={send}
          hint="O convite vai para este número."
          error={errors.phone}
          disabled={sending}
        />
      </View>

      {duplicate ? (
        <Banner
          icon="person_search"
          tone="warning"
          title={
            duplicate.state === 'active'
              ? `Este número é de ${duplicate.name}, que já está na sua rede`
              : duplicate.state === 'invited'
                ? `Você já convidou ${duplicate.name} neste número`
                : `Este número é de ${duplicate.name}, com a conexão encerrada`
          }
          text={
            duplicate.state === 'active'
              ? 'Não precisa convidar de novo: a pessoa já pode pedir viagens.'
              : duplicate.state === 'invited'
                ? `O convite foi enviado em ${longDate(duplicate.since)}. Para mandar de novo, use "Reenviar" na página da pessoa.`
                : 'Para voltar a levar essa pessoa, reative a conexão na página dela.'
          }
          actions={[
            {
              label: duplicate.state === 'ended' ? 'Reativar conexão' : 'Abrir página',
              icon: 'person',
              onPress: () => router.replace({ pathname: '/passenger/[id]', params: { id: duplicate.id } }),
            },
          ]}
        />
      ) : null}

      <View style={styles.preview}>
        <Label>Mensagem que vai no WhatsApp</Label>
        <Block background={colors.surfaceRaised} style={styles.bubble}>
          <Text variant="small">{message}</Text>
        </Block>
      </View>

      {errors.send ? (
        <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
          {errors.send}
        </Text>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  form: { gap: spacing[20] },
  preview: { gap: spacing[8] },
  bubble: { padding: spacing[16] },
  center: { alignSelf: 'center' },
});
