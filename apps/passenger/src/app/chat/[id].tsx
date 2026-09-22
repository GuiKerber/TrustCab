import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNow } from '@trustcab/core';
import { ChatScreen, colors, IconButton, layout, spacing, Text } from '@trustcab/ui';

import { markRead, retryMessage, sendMessage, useChat } from '@/data/chat';
import { knownDrivers, useConnections } from '@/data/connections';

// Conversa do passageiro com o motorista. O chat do topo abre direto aqui. Se você saiu da rede, o histórico fica.
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const connections = useConnections();
  const chat = useChat();

  const driver = knownDrivers(connections, now).find((d) => d.id === id);
  const messages = chat.messages[id] ?? [];

  useEffect(() => {
    markRead(id);
  }, [id, messages.length]);

  if (!driver) {
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

  const left = Boolean(connections.left[driver.id]);
  return (
    <ChatScreen
      name={driver.name}
      color={colors.cards[0]}
      messages={messages}
      now={now}
      viewer="passenger"
      onBack={() => router.back()}
      backLabel="Voltar"
      onCall={left ? undefined : () => Linking.openURL(`tel:${driver.phone}`)}
      onSend={(text) => sendMessage(driver.id, text)}
      onRetry={(messageId) => retryMessage(driver.id, messageId)}
      closedText={left ? `Você saiu da rede de ${driver.name.split(' ')[0]}. O histórico continua aqui, mas não dá para mandar mensagens.` : undefined}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  missing: { padding: layout.screenPadding, gap: spacing[12] },
});
