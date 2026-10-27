import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { parseInviteCode, useNow } from '@trustcab/core';
import { useAuth } from '@trustcab/core/auth';
import { Button, FormScreen, spacing, Text, TextField } from '@trustcab/ui';

import { InviteCard } from '@/components/InviteCard';
import { findInvite, joinDriver, myDriver, useConnections } from '@/data/connections';
import { askToJoin, useInvite, useNetwork } from '@/data/network';
import type { Driver } from '@/data/sample';

// Entrar na rede de um motorista. Pelo link, o código já vem preenchido; sem o link, você digita o código
// (o final do link, como trustcab-9bab6.web.app/i/ABCD2345). Primeiro mostra quem convidou; você confirma e pede.
//
// Com conta, o convite vem do Firestore e entrar virou pedir: nasce pendente e o motorista aprova do outro lado.
// Sem conta (demonstração), continua o convite de exemplo, que entra na hora.
export default function Join() {
  const params = useLocalSearchParams<{ code?: string }>();
  const now = useNow();
  const connections = useConnections();
  const { user } = useAuth();
  const [code, setCode] = useState(params.code ?? '');
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [sending, setSending] = useState(false);

  const remoto = user !== null;
  // Com conta, o código confirmado vai para o hook e o convite é lido no banco: só quem tem o código
  // em mãos consegue ler, porque as regras proíbem listar os convites.
  const [token, setToken] = useState<string | null>(() => (params.code ? parseInviteCode(params.code) : null));
  const convite = useInvite(remoto ? token : null);
  const rede = useNetwork(user?.uid ?? null);

  // Convite de exemplo, do caminho sem conta.
  const [local, setLocal] = useState<Driver | null>(() => (!remoto && params.code ? findInvite(params.code, now) : null));

  // O cartão do convite é o mesmo nos dois caminhos: só o carro muda de lugar.
  const found: Driver | null = remoto
    ? convite.data && convite.data.active && convite.data.driver
      ? {
          id: convite.data.driverId,
          name: convite.data.driver.name,
          phone: convite.data.driver.phone ?? '',
          vehicle: convite.data.driver.vehicle ?? { model: 'Carro', color: '', plate: '' },
          pix: { label: '', key: '' },
          since: now,
        }
      : null
    : local;

  const atual = remoto ? rede.current : myDriver(connections, now);
  const alreadyIn = Boolean(found && atual?.id === found.id);
  const otherDriver = found && atual && atual.id !== found.id ? atual : null;
  // Pedido já enviado e esperando resposta: nem dá para pedir de novo, nem é estar na rede.
  const esperando = remoto && found ? rede.waiting?.id === found.id : false;

  const check = () => {
    const clean = parseInviteCode(code);
    if (!clean) {
      setError('Escreva o código do convite. Ele fica no fim do link que o motorista te mandou.');
      return;
    }
    if (remoto) {
      setError(null);
      setToken(clean);
      return;
    }
    const driver = findInvite(clean, now);
    if (!driver) {
      setError('Este convite não está mais ativo ou o código está errado. Confira o código ou peça um novo link para quem te enviou.');
      setLocal(null);
      return;
    }
    setError(null);
    setLocal(driver);
  };

  const pedir = async () => {
    if (!found || !user) return;
    setSending(true);
    try {
      await askToJoin(found.id, user.uid, token ?? '');
      setJoined(true);
    } catch {
      setError('Não deu para enviar seu pedido agora. Confira a internet e tente de novo.');
    } finally {
      setSending(false);
    }
  };

  const limpar = () => {
    setToken(null);
    setLocal(null);
  };

  const first = found?.name.split(' ')[0] ?? '';
  // Com conta o pedido fica pendente; sem conta você entra na hora.
  const pendente = remoto && (joined || esperando);
  // Código conferido e sem convite no banco: o erro é do código, não da tela vazia.
  const naoAchou = remoto && token !== null && !convite.loading && !found;

  if ((joined || esperando) && found) {
    return (
      <FormScreen
        backIcon="close"
        backLabel="Fechar"
        onBack={() => router.back()}
        footer={
          pendente ? (
            <Button label="Entendi" variant="light" onPress={() => router.back()} />
          ) : (
            <>
              <Button label={`Pedir viagens com ${first}`} icon="add" variant="light" onPress={() => router.replace('/request')} />
              <Button label="Agora não" size="sm" variant="ghost" onPress={() => router.back()} style={styles.center} />
            </>
          )
        }>
        <View style={styles.head}>
          <Text variant="display">{pendente ? 'Pedido' : 'Você está'}</Text>
          <Text variant="display" tone="secondary">
            {pendente ? 'enviado' : 'na rede'}
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            {pendente
              ? `${first} recebeu seu pedido e precisa aprovar. Assim que isso acontecer, você pode pedir viagens.`
              : `Agora você pode pedir viagens com ${first}. Cada pedido vai para ${first} aprovar.`}
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
                label={remoto ? `Pedir para entrar na rede de ${first}` : `Entrar na rede de ${first}`}
                icon="group_add"
                variant="light"
                loading={sending}
                onPress={
                  remoto
                    ? pedir
                    : () => {
                        joinDriver(found);
                        setJoined(true);
                      }
                }
              />
              <Button label="Usar outro código" size="sm" variant="ghost" onPress={limpar} style={styles.center} />
            </>
          )
        ) : (
          <Button label="Ver convite" icon="arrow_forward" variant="light" loading={remoto && convite.loading} onPress={check} />
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
            if (token) setToken(null);
          }}
          placeholder="joao23"
          autoCapitalize="none"
          returnKeyType="go"
          onSubmitEditing={check}
          hint="Também dá para colar o link inteiro."
          error={
            error ??
            (naoAchou
              ? 'Este convite não está mais ativo ou o código está errado. Confira o código ou peça um novo link para quem te enviou.'
              : undefined)
          }
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
