import { useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Message } from '@trustcab/core';

import { borderWidth, colors, layout, radius, size, spacing, type } from '../theme/tokens';

import { Avatar } from './Avatar';
import { IconButton } from './Button';
import { MessageBubble } from './MessageBubble';
import { OfflineNotice } from './OfflineNotice';
import { Icon, Text } from './ui';

// Conversa, igual nos dois apps: suas mensagens à direita (claras), as da outra pessoa à esquerda, avisos no centro.
// Conexão encerrada: o histórico fica e o campo de mensagem dá lugar ao aviso ("closedText").
export function ChatScreen({
  name,
  color,
  messages,
  now,
  viewer,
  onBack,
  backLabel = 'Voltar para as conversas',
  onCall,
  onSend,
  onRetry,
  closedText,
}: {
  name: string;
  color: string;
  messages: Message[];
  now: Date;
  viewer: 'driver' | 'passenger';
  onBack: () => void;
  // O passageiro chega aqui direto pelo chat do topo (sem lista), então o "voltar" muda de nome.
  backLabel?: string;
  onCall?: () => void;
  onSend: (text: string) => void;
  onRetry: (id: string) => void;
  closedText?: string;
}) {
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const first = name.split(' ')[0];

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <IconButton name="arrow_back" label={backLabel} onPress={onBack} />
        <Avatar name={name} color={color} />
        <Text variant="bodyMedium" numberOfLines={1} style={styles.name} accessibilityRole="header">
          {name}
        </Text>
        {onCall ? <IconButton name="call" label={`Ligar para ${first}`} onPress={onCall} /> : null}
      </View>
      <View style={styles.offline}>
        <OfflineNotice />
      </View>

      {/* No Android o app roda de ponta a ponta e a tela não encolhe sozinha: "padding" empurra o campo para cima do teclado nos dois sistemas. */}
      <KeyboardAvoidingView style={styles.body} behavior="padding">
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          {messages.length === 0 ? (
            <Text variant="small" tone="secondary" style={styles.system}>
              {`Nenhuma mensagem ainda. Diga oi para ${first}.`}
            </Text>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} now={now} viewer={viewer} onRetry={() => onRetry(message.id)} />)
          )}
        </ScrollView>

        {closedText ? (
          <View style={styles.closed} accessibilityLiveRegion="polite">
            <Icon name="block" size={size.icon.md} color={colors.textSecondary} />
            <Text variant="small" tone="secondary" style={styles.closedText}>
              {closedText}
            </Text>
          </View>
        ) : (
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Mensagem"
              placeholderTextColor={colors.textSecondary}
              selectionColor={colors.orange}
              multiline
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              accessibilityLabel={`Mensagem para ${name}`}
              style={[styles.input, focused && styles.inputFocused]}
            />
            <IconButton name="send" label="Enviar mensagem" variant="light" disabled={!draft.trim()} onPress={send} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[8],
    borderBottomWidth: borderWidth.hairline,
    borderBottomColor: colors.line,
  },
  offline: { paddingHorizontal: layout.screenPadding },
  name: { flex: 1 },
  body: { flex: 1 },
  messages: { padding: layout.screenPadding, gap: spacing[12] },
  system: { textAlign: 'center', paddingHorizontal: spacing[20] },
  closed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[16],
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.line,
  },
  closedText: { flex: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[8],
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing[8],
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.line,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: size.iconButton.md,
    maxHeight: size.composerMaxHeight,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radius.block,
    borderWidth: borderWidth.strong,
    borderColor: colors.surface,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    outlineWidth: 0,
  },
  inputFocused: { borderColor: colors.text },
});
