import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { parseInviteCode, useNow } from '@trustcab/core';
import { Button, FormScreen, spacing, Text, TextField } from '@trustcab/ui';

import { InviteCard } from '@/components/InviteCard';
import { findInvite, joinDriver, myDriver, useConnections } from '@/data/connections';
import type { Driver } from '@/data/sample';

// Entrar na rede de um motorista. Pelo link, o código já vem preenchido; sem o link, você digita o código
// (o final do link, como trustcab-9bab6.web.app/i/ABCD2345). Primeiro mostra quem convidou; você confirma e entra.
export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>();
  const now = useNow();
  const connections = useConnections();
  const [code, setCode] = useState(params.code ?? '');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<Driver | null>(() => (params.code ? findInvite(params.code, now) : null));
  const [joined, setJoined] = useState(false);
  // No MVP, um motorista por passageiro: com alguém na rede, o convite de outra pessoa só entra depois de sair.
  const current = myDriver(connections, now);
  const alreadyIn = Boolean(found && current?.id === found.id);
  const otherDriver = found && current && current.id !== found.id ? current : null;

  const check = () => {
    const clean = parseInviteCode(code);
    if (!clean) {
      setError('Escreva o código do convite. Ele fica no fim do link que o motorista te mandou.');
      return;
    }
    const driver = findInvite(clean, now);
    if (!driver) {
      setError('Este convite não está mais ativo ou o código está errado. Confira o código ou peça um novo link para quem te enviou.');
      setFound(null);
      return;
    }
    setError(null);
    setFound(driver);
  };

  const first = found?.name.split(' ')[0] ?? '';

  if (joined && found) {
    return (
      <FormScreen
        backIcon="close"
        backLabel="Fechar"
        onBack={() => router.back()}
        footer={
          <>
            <Button label={`Pedir viagens com ${first}`} icon="add" variant="light" onPress={() => router.replace('/request')} />
            <Button label="Agora não" size="sm" variant="ghost" onPress={() => router.back()} style={styles.center} />
          </>
        }>
        <View style={styles.head}>
          <Text variant="display">Você está</Text>
          <Text variant="display" tone="secondary">
            na rede
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            {`Agora você pode pedir viagens com ${first}. Cada pedido vai para ${first} aprovar.`}
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
      footer={
        found ? (
          alreadyIn || otherDriver ? (
            <Button label={alreadyIn ? `Ver página de ${first}` : 'Ver seu motorista'} icon="person" variant="light" onPress={() => router.navigate('/driver')} />
          ) : (
            <>
              <Button
                label={`Entrar na rede de ${first}`}
                icon="group_add"
                variant="light"
                onPress={() => {
                  joinDriver(found);
                  setJoined(true);
                }}
              />
              <Button label="Usar outro código" size="sm" variant="ghost" onPress={() => setFound(null)} style={styles.center} />
            </>
          )
        ) : (
          <Button label="Ver convite" icon="arrow_forward" variant="light" onPress={check} />
        )
      }>
      <View style={styles.head}>
        <Text variant="display">Tenho um</Text>
        <Text variant="display" tone="secondary">
          convite
        </Text>
        <Text variant="body" tone="secondary" style={styles.lead}>
          Só motoristas que você conhece podem te convidar. Confira quem é antes de entrar.
        </Text>
      </View>

      {found ? (
        <>
          <InviteCard driver={found} />
          {alreadyIn ? (
            <Text variant="small" tone="secondary" accessibilityLiveRegion="polite">
              {`Você já está na rede de ${first}.`}
            </Text>
          ) : otherDriver ? (
            <Text variant="small" tone="orange" accessibilityLiveRegion="polite">
              {`Você está na rede de ${otherDriver.name.split(' ')[0]}. Cada passageiro tem um motorista: para entrar na rede de ${first}, saia primeiro da atual, na aba Motorista.`}
            </Text>
          ) : null}
        </>
      ) : (
        <TextField
          label="Código do convite"
          value={code}
          onChangeText={(value) => {
            setCode(value);
            setError(null);
          }}
          placeholder="joao23"
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={check}
          hint="Também dá para colar o link inteiro."
          error={error ?? undefined}
        />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: spacing[4] },
  lead: { marginTop: spacing[12] },
  center: { alignSelf: 'center' },
});
