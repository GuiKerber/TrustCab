import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bookingShortUrl, daysOfAccess, formatPhone, priceLabel, todayISO, weekdayList } from '@trustcab/core';
import { colors, Label, layout, ListRow, spacing, Text } from '@trustcab/ui';

import { TopBar } from '@/components/TopBar';
import { useDriver } from '@/data/driver';
import { PIX_TYPES, useProfile } from '@/data/profile';
import { driver } from '@trustcab/core';
import { useAuth } from '@trustcab/core/auth';

// Perfil: quem você é, como recebe (Pix), o carro que aparece na sua página e o link de agenda.
export default function Profile() {
  const { user, devSession } = useAuth();
  const profile = useProfile();
  const { phone, slug, slots, plan, open } = useDriver();
  const name = user?.displayName ?? driver.firstName;
  const restam = daysOfAccess(plan, todayISO());

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
          <Label>Sua agenda</Label>
          <ListRow
            icon="chat"
            title="Seu WhatsApp"
            value={phone ? formatPhone(phone) : 'Cadastre: é por ele que o passageiro fala com você'}
            pending={!phone}
            first
            last={false}
            onPress={() => router.push('/phone')}
          />
          <ListRow
            icon="link"
            title="Seu link"
            value={slug ? bookingShortUrl(slug) : 'Gere o link que você manda no WhatsApp'}
            pending={!slug}
            first={false}
            last={false}
            onPress={() => router.push('/link')}
            accessibilityHint="Abre o link para compartilhar ou gerar outro"
          />
          <ListRow
            icon="schedule"
            title="Horários"
            value={`${weekdayList(slots.weekdays)} · ${slots.from} às ${slots.to}`}
            first={false}
            last
            onPress={() => router.push('/hours')}
            accessibilityHint="Define o que aparece para quem abre seu link"
          />
        </View>

        <View style={styles.section}>
          <Label>Conta</Label>
          <ListRow
            icon="workspace_premium"
            title="Plano"
            value={
              plan.status === 'active'
                ? `Assinatura ativa · ${priceLabel()} por mês`
                : !open
                  ? 'Mês grátis encerrado · seu link não recebe pedidos'
                  : restam === 1
                    ? 'Seu mês grátis acaba hoje'
                    : `Mês grátis · ${restam} dias`
            }
            pending={!open}
            first
            last={false}
            onPress={() => router.push('/plan')}
            accessibilityHint="Abre os planos"
          />
          <ListRow
            icon="settings"
            title="Configurações"
            value="Notificações, sair e excluir conta"
            first={false}
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
  head: { gap: spacing[4], paddingHorizontal: layout.textInset, paddingTop: spacing[20] },
  section: { gap: spacing[8] },
});
