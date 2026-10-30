import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/tokens';

import { Label } from './ui';

// Linhas em blocos conectados: cantos pequenos entre elas e grandes só nas pontas do grupo.
// O grupo diz a cada linha se ela é a primeira e a última, para ninguém ter de contar à mão
// (e errar quando uma linha aparece ou some). Serve a qualquer linha que aceite "first" e "last":
// ListRow, MonthRow, PersonCard.
export function ListGroup({ label, children }: { label?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{ first?: boolean; last?: boolean }>[];

  return (
    <View style={styles.wrapper}>
      {label ? <Label>{label}</Label> : null}
      <View style={styles.rows}>
        {rows.map((row, index) => cloneElement(row, { first: index === 0, last: index === rows.length - 1 }))}
      </View>
    </View>
  );
}

// Cantos de uma linha conectada, conforme a posição no grupo.
export function joinedCorners(first: boolean, last: boolean, outer: number, inner: number) {
  return {
    borderTopLeftRadius: first ? outer : inner,
    borderTopRightRadius: first ? outer : inner,
    borderBottomLeftRadius: last ? outer : inner,
    borderBottomRightRadius: last ? outer : inner,
  };
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing[8] },
  rows: { gap: spacing[4] },
});
