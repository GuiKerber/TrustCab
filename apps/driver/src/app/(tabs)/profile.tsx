import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { inviteShortUrl } from '@trustcab/core';
import { colors, Label, layout, ListRow, spacing, Text } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { PIX_TYPES, useProfile } from '@/data/profile';
import { driver } from '@trustcab/core';
import { useAuth } from '@trustcab/core/auth';

// Perfil: quem você é, como recebe (Pix), o carro que aparece no aviso "Cheguei" e seu link de convite.
export default function Profile() {
  const { user, devSession } = useAuth();
  const profile = useProfile();
  const name = user?.displayName ?? driver.firstName;

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
          <Label>Recebimento</Label>
          <ListRow
            icon="qr_code_2"
            title="Chave Pix"
            value={profile.pix ? `${PIX_TYPES[profile.pix.type].label} · ${profile.pix.key}` : 'Crie para cobrar e mostrar o QR Code'}
            pending={!profile.pix}
            first
            last
            onPress={() => router.push('/pix')}
          />
        </View>

        <View style={styles.section}>
          <Label>Carro</Label>
          <ListRow
            icon="directions_car"
            title="Veículo"
            value={profile.vehicle ? `${profile.vehicle.model} ${profile.vehicle.color} · ${profile.vehicle.plate}` : 'Adicione: aparece no aviso "Cheguei"'}
            pending={!profile.vehicle}
            first
            last
            onPress={() => router.push('/vehicle')}
          />
        </View>

        <View style={styles.section}>
          <Label>Convite</Label>
          <ListRow
            icon="link"
            title="Seu link de convite"
            value={inviteShortUrl(profile.inviteToken)}
            first
            last
            onPress={() => router.push('/invite-link')}
            accessibilityHint="Abre o link para compartilhar ou gerar um novo"
          />
        </View>

        <View style={styles.section}>
          <Label>Conta</Label>
          <ListRow
            icon="settings"
            title="Configurações"
            value="Notificações, sair e excluir conta"
            first
            last
            onPress={() => router.push('/settings')}
          />
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
