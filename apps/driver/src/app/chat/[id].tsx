import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { samplePassengers, useNow } from '@trustcab/core';
import { ChatScreen, colors, IconButton, layout, spacing, Text } from '@trustcab/ui';

import { markRead, retryMessage, sendMessage, useChat } from '@/data/chat';
import { usePassengerStore, withState } from '@/data/passengers';

// Conversa do motorista com um passageiro. Passageiro encerrado: o histórico fica, sem enviar mensagens.
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const base = useMemo(() => samplePassengers(now), [now]);
  const passengers = usePassengerStore();
  const chat = useChat();

  const all = withState(base, passengers);
  const index = all.filter((p) => p.state === 'active').findIndex((p) => p.id === id);
  const passenger = all.find((p) => p.id === id);
  const messages = chat.messages[id] ?? [];

  useEffect(() => {
    markRead(id);
  }, [id, messages.length]);

  if (!passenger) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.missing}>
          <IconButton name="arrow_back" label="Voltar" onPress={() => router.back()} />
          <Text variant="heading" tone="secondary">
            Não encontramos esta conversa.
          </Text>
          <Text variant="small" tone="secondary">
            Volte para a lista de conversas e tente de novo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ended = passenger.state === 'ended';
  return (
    <ChatScreen
      name={passenger.name}
      color={colors.cards[Math.max(index, 0) % colors.cards.length]}
      messages={messages}
      now={now}
      viewer="driver"
      onBack={() => router.back()}
      onCall={ended ? undefined : () => Linking.openURL(`tel:${passenger.phone}`)}
      onSend={(text) => sendMessage(passenger.id, text)}
      onRetry={(messageId) => retryMessage(passenger.id, messageId)}
      closedText={ended ? `Você encerrou a conexão com ${passenger.name.split(' ')[0]}. O histórico continua aqui, mas não dá para mandar mensagens.` : undefined}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  missing: { padding: layout.screenPadding, gap: spacing[12] },
});
