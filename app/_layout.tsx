import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useSessionStore } from '../stores/session.store';
import { registrarPushToken } from '../lib/notifications';
import { dispositivosApi } from '../services/api/dispositivos';

const ONBOARDING_KEY = 'onboarding_completado_v1';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AuthGuard() {
  const { session, isLoading, setSession, setLoading } = useSessionStore();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingVisto, setOnboardingVisto] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    SecureStore.getItemAsync(ONBOARDING_KEY).then((val) => {
      setOnboardingVisto(!!val);
      setOnboardingChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Escuchar notificaciones recibidas con la app abierta
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // La notificación se muestra automáticamente por el handler global
    });

    // Manejar tap en notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.loteId) router.push(`/lotes/${data.loteId}`);
      else if (data?.animalId) router.push(`/animales/${data.animalId}`);
    });

    return () => {
      listener.subscription.unsubscribe();
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;

    const enAuth      = segments[0] === '(auth)';
    const enOnboarding = segments[0] === 'onboarding';

    if (!session) {
      // Sin sesión: onboarding primero, luego login
      if (!enAuth && !enOnboarding) {
        router.replace(onboardingVisto ? '/(auth)/login' : '/onboarding');
      }
    } else {
      // Con sesión: ir a tabs
      if (enAuth || enOnboarding) {
        registrarPushToken().then((token) => {
          if (token) {
            const plataforma = Platform.OS === 'ios' ? 'ios'
              : Platform.OS === 'android' ? 'android' : 'web';
            dispositivosApi.registrarToken(token, plataforma).catch(() => {});
          }
        });
        router.replace('/(tabs)');
      }
    }
  }, [session, isLoading, segments, onboardingChecked, onboardingVisto]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
