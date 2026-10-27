import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { InterTight_700Bold } from '@expo-google-fonts/inter-tight/700Bold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnline } from '@trustcab/core';
import { AuthProvider, useAuth } from '@trustcab/core/auth';
import { useNotificationLinks } from '@trustcab/core/notifications';
import { colors, ErrorState } from '@trustcab/ui';

import { setOnline } from '@/data/chat';
import { resetProfile, useProfile } from '@/data/profile';
import { usePendingInvite } from '@/lib/invite';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, InterTight_700Bold });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ground }}>
      <StatusBar style="light" />
      <AuthProvider onDeleted={resetProfile}>
        <Routes />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

// Proteção do app inteiro: um erro inesperado em qualquer tela mostra a tela de erro, com "Tentar de novo".
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <ErrorState detail={error.message} onRetry={retry} />
    </SafeAreaView>
  );
}

// Sem sessão, só o login. Com sessão e sem primeiro acesso feito, o onboarding. Depois, o app inteiro.
function Routes() {
  const { status } = useAuth();
  const { onboarded } = useProfile();
  const online = useOnline();
  useNotificationLinks();
  // Convite que chegou pelo link ou pela instalação espera a conta e o primeiro acesso para abrir.
  usePendingInvite(status === 'signedIn' && onboarded);

  // O que ficou "Enviando…" sem internet sai quando a conexão volta.
  useEffect(() => {
    setOnline(online);
  }, [online]);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'signedIn';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="request" />
        <Stack.Screen name="join" options={{ presentation: 'modal' }} />
        <Stack.Screen name="i/[token]" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="phone" />
        <Stack.Screen name="trip/[id]" />
      </Stack.Protected>
    </Stack>
  );
}
