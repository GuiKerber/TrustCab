import type { AndroidSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, spacing } from '../theme/tokens';

import { IconButton } from './Button';
import { OfflineNotice } from './OfflineNotice';

// Topo das telas que se abrem por cima das abas (formulários, página do passageiro, configurações):
// voltar à esquerda e, se a tela tiver, as ações dela à direita. Sem internet, a faixa de aviso
// aparece logo abaixo — é a mesma do TopBar das abas, para nenhuma tela ficar sem ela.
// Sem "onBack" (o primeiro passo do primeiro acesso), o topo não tem voltar.
export function BackBar({
  onBack,
  backLabel = 'Voltar',
  backIcon = 'arrow_back',
  trailing,
}: {
  onBack?: () => void;
  backLabel?: string;
  backIcon?: AndroidSymbol;
  trailing?: ReactNode;
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {onBack ? <IconButton name={backIcon} label={backLabel} onPress={onBack} /> : <View />}
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <OfflineNotice />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[8] },
  row: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
});
