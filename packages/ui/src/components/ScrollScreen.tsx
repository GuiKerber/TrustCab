import type { ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '../theme/tokens';

// Tela que rola, sem campos de texto (essas usam o FormScreen): as cinco abas, a página do passageiro
// e a de app fechado. Margem, respiro do topo, intervalo entre blocos e fundo saem daqui, iguais em todas.
//
// "tabBar": nas abas o fim da rolagem deixa espaço para o menu flutuante não cobrir o último item.
// "overlay" fica fora da rolagem, por cima da tela: folhas, confirmações e avisos.
export function ScrollScreen({
  children,
  overlay,
  tabBar = true,
  ref,
}: {
  children: ReactNode;
  overlay?: ReactNode;
  tabBar?: boolean;
  // Para rolar até um ponto da tela (a Agenda leva até o dia tocado na grade).
  ref?: Ref<ScrollView>;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView ref={ref} contentContainerStyle={[styles.content, tabBar ? styles.endTabBar : styles.end]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {overlay}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ground },
  content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing[8], gap: spacing[20] },
  endTabBar: { paddingBottom: layout.scrollEnd },
  end: { paddingBottom: spacing[40] },
});
