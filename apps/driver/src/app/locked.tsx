import { router } from 'expo-router';

import { priceLabel } from '@trustcab/core';
import { Button, colors, InfoBlock, layout, OfflineNotice, PageHeader, spacing, Text } from '@trustcab/ui';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDriver } from '@/data/driver';

// A porta fechada. Sem assinatura o app inteiro para: agenda, pedidos, passageiros, ganhos.
//
// O que fica de pé é só o caminho de volta (assinar) e o de saída (Configurações, com a exclusão
// de conta) — trancar alguém dentro da própria conta não é cobrança, é sequestro de dado.
//
// Nada é apagado. O motorista volta a combinar as caronas como fazia antes de existir TrustCab,
// pelo WhatsApp dele, com os contatos dele; e no dia em que assinar, encontra tudo onde deixou.
export default function LockedScreen() {
  const { plan, name } = useDriver();
  const terminouOTeste = plan.source === 'none';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <OfflineNotice />
        <PageHeader
          title={terminouOTeste ? 'Seu mês' : 'Sua assinatura'}
          subtitle={terminouOTeste ? 'grátis acabou' : 'acabou'}
          lead={
            terminouOTeste
              ? `Os 30 dias terminaram. Para voltar a receber pedidos, ver sua agenda e confirmar viagens, a assinatura é ${priceLabel()} por mês.`
              : `Para voltar a usar o TrustCab, assine de novo por ${priceLabel()} por mês.`
          }
        />

        <Button
          label={`Assinar por ${priceLabel()}`}
          icon="workspace_premium"
          variant="light"
          onPress={() => router.push('/plan')}
        />

        <InfoBlock
          label="Nada foi apagado"
          text="Seus passageiros, suas agendas, suas viagens e seu histórico continuam guardados. Assinando, tudo volta como estava e seu link volta a receber pedidos no mesmo instante."
        />

        <InfoBlock
          label="Enquanto isso"
          text="Quem já tinha carona combinada com você não recebe aviso nenhum do TrustCab. Fale com essas pessoas pelo seu WhatsApp, como você fazia antes."
        />

        <Button
          label="Configurações"
          icon="settings"
          size="sm"
          variant="ghost"
          onPress={() => router.push('/settings')}
          style={styles.centro}
        />
        <Text variant="small" tone="secondary" style={styles.rodape}>
          {name ? `Conectado como ${name}. ` : ''}Em Configurações estão os termos, a política de
          privacidade e a exclusão da conta.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing[28],
    paddingBottom: layout.scrollEnd,
    gap: spacing[20],
  },
  centro: { alignSelf: 'center' },
  rodape: { paddingHorizontal: layout.textInset, textAlign: 'center' },
});
