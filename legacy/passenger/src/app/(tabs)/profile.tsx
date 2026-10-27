import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPhone } from '@trustcab/core';
import { useAuth } from '@trustcab/core/auth';
import { colors, Label, layout, ListRow, spacing, Text } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { useProfile } from '@/data/profile';
import { me } from '@/data/sample';

// Perfil do passageiro: quem você é, seu celular (para o motorista te ligar), convites e a conta.
export default function Profile() {
  const { user, devSession } = useAuth();
  const profile = useProfile();
  const name = user?.displayName ?? me.name;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TopBar title="Perfil" />

        <View style={styles.head}>
          <Text variant="display">{name}</Text>
          <Text variant="body" tone="secondary">
            {devSession ? 'Sessão de desenvolvimento, sem conta Google.' : (user?.email ?? '')}
          </Text>
        </View>

        <View style={styles.section}>
          <Label>Contato</Label>
          <ListRow
            icon="call"
            title="Celular"
            value={profile.phone ? formatPhone(profile.phone) : 'Opcional: com ele, o motorista consegue te ligar'}
            first
            last
            onPress={() => router.push('/phone')}
          />
        </View>

        <View style={styles.section}>
          <Label>Convites</Label>
          <ListRow icon="key" title="Tenho um convite" value="Entre na rede de outro motorista" first last onPress={() => router.push('/join')} />
        </View>

        <View style={styles.section}>
          <Label>Conta</Label>
          <ListRow icon="settings" title="Configurações" value="Notificações, sair e excluir conta" first last onPress={() => router.push('/settings')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], paddingBottom: layout.scrollEnd, gap: spacing[28] },
  head: { gap: spacing[4], paddingHorizontal: spacing[4], paddingTop: spacing[20] },
  section: { gap: spacing[8] },
});
