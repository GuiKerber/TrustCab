import { router } from 'expo-router';

import { priceLabel } from '@trustcab/core';
import { Block, Button, colors, Label, layout, OfflineNotice, spacing, Text } from '@trustcab/ui';
import { ScrollView, StyleSheet, View } from 'react-native';
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
        <View style={styles.head}>
          <Text variant="display">{terminouOTeste ? 'Seu mês' : 'Sua assinatura'}</Text>
          <Text variant="display" tone="secondary">
            {terminouOTeste ? 'grátis acabou' : 'acabou'}
          </Text>
          <Text variant="body" tone="secondary" style={styles.lead}>
            {terminouOTeste
              ? `Os 30 dias terminaram. Para voltar a receber pedidos, ver sua agenda e confirmar viagens, a assinatura é ${priceLabel()} por mês.`
              : `Para voltar a usar o TrustCab, assine de novo por ${priceLabel()} por mês.`}
          </Text>
        </View>

        <Button
          label={`Assinar por ${priceLabel()}`}
          icon="workspace_premium"
          variant="light"
          onPress={() => router.push('/plan')}
        />

        <Block style={styles.nota}>
          <Label>Nada foi apagado</Label>
          <Text variant="small" tone="secondary">
            Seus passageiros, suas agendas, suas viagens e seu histórico continuam guardados. Assinando,
            tudo volta como estava e seu link volta a receber pedidos no mesmo instante.
          </Text>
        </Block>

        <Block style={styles.nota}>
          <Label>Enquanto isso</Label>
          <Text variant="small" tone="secondary">
            Quem já tinha carona combinada com você não recebe aviso nenhum do TrustCab. Fale com essas
            pessoas pelo seu WhatsApp, como você fazia antes.
          </Text>
        </Block>

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
  head: { paddingHorizontal: layout.textInset },
  lead: { marginTop: spacing[12] },
  nota: { gap: spacing[4] },
  centro: { alignSelf: 'center' },
  rodape: { paddingHorizontal: layout.textInset, textAlign: 'center' },
});
