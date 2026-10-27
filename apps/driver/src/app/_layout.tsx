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

import { isOpen, newPlan, todayISO, type Plan } from '@trustcab/core';
import { colors, ErrorState } from '@trustcab/ui';
import { mergeRemote, resetProfile, setCurrentUid, useProfile } from '@/data/profile';
import { AuthProvider, useAuth } from '@trustcab/core/auth';
import { useProfileDoc } from '@trustcab/core/db';
import { useNotificationLinks } from '@/lib/notifications';

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

// Sem sessão, só o login existe. Com sessão e sem primeiro acesso feito, o onboarding. Depois, o app inteiro.
// A splash some quando a sessão é conhecida.
function Routes() {
  const { status, user } = useAuth();
  const { onboarded } = useProfile();
  useNotificationLinks();

  // Com conta, o perfil é criado no Firestore no primeiro acesso e carro e Pix passam a vir
  // de lá. É o mesmo documento que a página de agendamento lê para montar o cartão do motorista.
  const { profile: remote } = useProfileDoc(user);
  useEffect(() => {
    setCurrentUid(user?.uid ?? null);
  }, [user]);
  useEffect(() => {
    mergeRemote(remote ? { vehicle: remote.vehicle, pix: remote.pix } : null);
  }, [remote]);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;
  const signedIn = status === 'signedIn';

  // Só tranca com o plano em mãos. Enquanto o perfil não chega, o app continua aberto: ninguém
  // pode perder a agenda do dia porque o celular ficou sem sinal na hora errada.
  const locked = Boolean(remote) && !isOpen((remote?.plan as Plan) ?? newPlan(), todayISO());

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ground } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      {/* Plano vencido: o app some e sobra a porta fechada. Assinar e Configurações continuam de pé
          nos dois estados — um para voltar, o outro porque sair da própria conta não pode depender
          de estar pagando. */}
      <Stack.Protected guard={signedIn && onboarded && locked}>
        <Stack.Screen name="locked" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="plan" />
        <Stack.Screen name="settings" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && onboarded && !locked}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="passenger/[id]" />
        <Stack.Screen name="pix" />
        <Stack.Screen name="vehicle" />
        <Stack.Screen name="link" />
        <Stack.Screen name="phone" />
        <Stack.Screen name="hours" />
        <Stack.Screen name="trip/[id]" />
      </Stack.Protected>
    </Stack>
  );
}
