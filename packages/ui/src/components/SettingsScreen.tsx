import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../theme/tokens';

import { Banner } from './Banner';
import { Button, IconButton } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { OfflineNotice } from './OfflineNotice';
import { Toggle } from './Toggle';
import { Label, Text } from './ui';

export type NotificationGroup = {
  title: string;
  items: { key: string; title: string; text: string; value: boolean; onChange: (value: boolean) => void }[];
};

// Permissão de notificação do sistema: liberada, bloqueada, ainda não pedida ou sem suporte (navegador, Expo Go).
export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported' | null;

// Configurações da conta, iguais nos dois apps: quais avisos receber, sair e excluir a conta.
// Cada app passa os próprios grupos de avisos e as ações de conta.
export function SettingsScreen({
  account,
  groups,
  permission,
  onRequestPermission,
  onOpenSystemSettings,
  onBack,
  onSignOut,
  onDelete,
  deleteText,
}: {
  // E-mail da conta (ou o aviso de sessão de desenvolvimento).
  account: string;
  groups: NotificationGroup[];
  permission: NotificationPermission;
  onRequestPermission: () => void;
  onOpenSystemSettings: () => void;
  onBack: () => void;
  onSignOut: () => void;
  // Exclui a conta. Devolve o que deu errado e o que fazer, se falhar.
  onDelete: () => Promise<string | null>;
  // O que some ao excluir, dito para esta pessoa.
  deleteText: string;
}) {
  const [confirm, setConfirm] = useState<'signOut' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = permission === 'denied';

  const close = () => {
    setConfirm(null);
    setError(null);
  };

  const remove = async () => {
    setBusy(true);
    const problem = await onDelete();
    setBusy(false);
    if (problem) setError(problem);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconButton name="arrow_back" label="Voltar para o perfil" onPress={onBack} />
          <OfflineNotice />
        </View>

        <View style={styles.head}>
          {/* Palavra longa: no tamanho "display" ela quebraria no meio em celulares estreitos. */}
          <Text variant="displaySm">Configurações</Text>
          <Text variant="body" tone="secondary">
            {account}
          </Text>
        </View>

        <View style={styles.block}>
          <Text variant="title">Notificações</Text>
          {blocked ? (
            <Banner
              icon="notifications_off"
              tone="warning"
              title="Notificações bloqueadas no celular"
              text="Você não recebe nenhum aviso do TrustCab. Para ativar, permita notificações nas configurações do celular."
              actions={[{ label: 'Abrir configurações', icon: 'settings', onPress: onOpenSystemSettings }]}
            />
          ) : permission === 'undetermined' ? (
            <Banner
              icon="notifications"
              title="Ative as notificações"
              text="Sem a permissão do celular, os avisos abaixo não aparecem."
              actions={[{ label: 'Ativar', icon: 'notifications', onPress: onRequestPermission }]}
            />
          ) : permission === 'unsupported' ? (
            <Text variant="small" tone="secondary">
              Aqui (navegador ou Expo Go) as notificações não aparecem. No app instalado, elas seguem estas escolhas.
            </Text>
          ) : null}
          {groups.map((group) => (
            <View key={group.title} style={styles.section}>
              <Label>{group.title}</Label>
              <View>
                {group.items.map((item) => (
                  <Toggle key={item.key} label={item.title} hint={item.text} value={item.value} disabled={blocked} onChange={item.onChange} />
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <Text variant="title">Conta</Text>
          <Button label="Sair da conta" icon="logout" variant="surface" onPress={() => setConfirm('signOut')} />
          <View style={styles.danger}>
            <Button label="Excluir conta" icon="delete_forever" variant="danger" onPress={() => setConfirm('delete')} />
            <Text variant="small" tone="secondary">
              Apaga seus dados, encerra todas as conexões e tira você do app. Não dá para desfazer.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirm === 'signOut'}
        title="Sair da conta?"
        text="Seus dados continuam guardados. Para voltar, é só entrar de novo com o Google."
        confirmLabel="Sair"
        confirmIcon="logout"
        onConfirm={() => {
          close();
          onSignOut();
        }}
        onClose={close}
      />
      <ConfirmDialog
        visible={confirm === 'delete'}
        title="Excluir sua conta?"
        text={deleteText}
        confirmLabel="Excluir conta de vez"
        confirmIcon="delete_forever"
        confirmVariant="danger"
        loading={busy}
        error={error}
        onConfirm={remove}
        onClose={close}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: spacing[40], gap: spacing[28] },
  top: { gap: spacing[8] },
  head: { gap: spacing[4], paddingHorizontal: spacing[4] },
  block: { gap: spacing[16] },
  section: { gap: spacing[4] },
  danger: { gap: spacing[8], marginTop: spacing[20] },
});
