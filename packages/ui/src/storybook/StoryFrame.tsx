import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols/400Regular';
import { useFonts } from 'expo-font';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors, layout } from '../theme/tokens';

// Mesmo ambiente do app em toda story, no navegador e no celular: fontes, gestos, áreas seguras e o fundo escuro.
// "padded" desliga nas stories de tela cheia (parameters.layout = 'fullscreen').
export function StoryFrame({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_700Bold,
    // Fonte dos ícones (expo-symbols). No navegador do Storybook ela não carrega sozinha.
    MaterialSymbols_400Regular,
  });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={[styles.canvas, padded && styles.padded]}>{children}</View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  canvas: { flex: 1, backgroundColor: colors.ground },
  padded: { padding: layout.screenPadding },
});
