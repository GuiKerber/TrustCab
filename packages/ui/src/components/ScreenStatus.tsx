import { SafeAreaView } from 'react-native-safe-area-context';

import { type SyncState, useOnline } from '@trustcab/core';
import { colors } from '../theme/tokens';

import { ErrorState } from './ErrorState';
import { ScreenSkeleton, type SkeletonLayout } from './Skeleton';

// Enquanto a tela carrega, o esqueleto dela; se a leitura falhar, a tela de erro (com texto próprio sem internet).
export function ScreenStatus({ state, layout, onRetry }: { state: Exclude<SyncState, 'ready'>; layout: SkeletonLayout; onRetry: () => void }) {
  const online = useOnline();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }} edges={['top', 'left', 'right']}>
      {state === 'loading' ? <ScreenSkeleton layout={layout} /> : <ErrorState offline={!online} onRetry={onRetry} />}
    </SafeAreaView>
  );
}
