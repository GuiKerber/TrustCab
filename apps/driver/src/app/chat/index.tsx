import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, ConversationRow, IconButton, layout, ScreenStatus, spacing, Text } from '@trustcab/ui';
import { unreadCount, useChat } from '@/data/chat';
import { usePassengerStore, withState } from '@/data/passengers';
import { samplePassengers, useNow, useSyncState } from '@trustcab/core';

// Conversas: uma por passageiro ativo, a mais recente no topo. Não lidas com contador.
export default function Conversations() {
  const now = useNow();
  const base = useMemo(() => samplePassengers(now), [now]);
  const passengers = usePassengerStore();
  const chat = useChat();
  const sync = useSyncState();

  const active = withState(base, passengers).filter((p) => p.state === 'active');
  const rows = active
    .map((passenger, index) => ({
      passenger,
      color: colors.cards[index % colors.cards.length],
      last: chat.messages[passenger.id]?.at(-1),
      unread: unreadCount(chat, passenger.id),
    }))
    .sort((a, b) => (b.last?.at.getTime() ?? 0) - (a.last?.at.getTime() ?? 0));

  if (sync.state !== 'ready') return <ScreenStatus state={sync.state} layout="chat" onRetry={sync.retry} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton name="close" label="Fechar conversas" onPress={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text variant="display" accessibilityRole="header">
          Conversas
        </Text>

        {rows.length > 0 ? (
          <View style={styles.list}>
            {rows.map(({ passenger, color, last, unread }, index) => (
              <ConversationRow
                key={passenger.id}
                name={passenger.name}
                color={color}
                last={last}
                unread={unread}
                now={now}
                first={index === 0}
                lastRow={index === rows.length - 1}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: passenger.id } })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text variant="heading" tone="secondary">
              Nenhuma conversa ainda.
            </Text>
            <Text variant="small" tone="secondary">
              Quando alguém aceitar seu convite, a conversa aparece aqui.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  topBar: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8] },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[20], paddingBottom: spacing[40], gap: spacing[20] },
  list: { gap: spacing[2] },
  empty: { gap: spacing[8], paddingHorizontal: spacing[4] },
});
