import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';

import { StatusBar } from 'expo-status-bar';
import { useThemeContext } from '../context/ThemeContext';

// Ignore the specific warning about Expo Go Push Notifications on Android
// as we are only using Local Notifications.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'The "expo-notifications" library is not supported in Expo Go',
]);

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { isDark } = useThemeContext();

  useEffect(() => {
    if (isLoading) return;

    // Check if the current route is in the auth group (sign-in or sign-up)
    const inAuthRoute = segments[0] === 'sign-in' || segments[0] === 'sign-up';

    if (!user && !inAuthRoute) {
      // Redirect to sign-in if not logged in and not on an auth screen
      router.replace('/sign-in');
    } else if (user && inAuthRoute) {
      // Redirect to home if logged in and trying to access auth screens
      router.replace('/');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#000' : '#fff'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="create-task" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
