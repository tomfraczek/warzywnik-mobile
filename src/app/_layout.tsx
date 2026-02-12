// app/_layout.tsx (albo odpowiedni RootLayout w Twoim projekcie)

import { setAuthErrorHandler, setAuthTokenProvider } from "@/src/api/axios";
import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { clientPersister, queryClient } from "../api/queryClient";
import { ThemeModeProvider, useThemeMode } from "../context/ThemeModeProvider";

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // GŁÓWNE
    primary: "#C6A75E", // złoto
    secondary: "#A8893D", // ciemniejsze złoto
    tertiary: "#E5C97A", // jaśniejsze złoto

    // TŁA
    background: "#F5F3EF", // bardzo jasny beż / off-white
    surface: "#FFFFFF",

    // TEKST
    onPrimary: "#111111",
    onSecondary: "#111111",
    onTertiary: "#111111",
    onBackground: "#121212",
    onSurface: "#121212",

    // SYSTEM
    error: "#C0392B",
    outline: "#D6D0C4",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    // GŁÓWNE
    primary: "#D4AF37", // złoto (bardziej wyraziste)
    secondary: "#C6A75E",
    tertiary: "#E6C878",

    // TŁA
    background: "#0F0F10", // głęboka czerń
    surface: "#1A1A1C", // jaśniejszy czarny / grafit

    // TEKST
    onPrimary: "#111111",
    onSecondary: "#111111",
    onTertiary: "#111111",
    onBackground: "#EAEAEA",
    onSurface: "#EAEAEA",

    // SYSTEM
    error: "#FF6B6B",
    outline: "#2A2A2D",
  },
};

function AuthBootstrapGate() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const isHandlingAuthError = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setAuthTokenProvider(async () => null);
      setReady(true);
      return;
    }

    setAuthTokenProvider(async () => (await getToken()) ?? null);

    setAuthErrorHandler(async (_status) => {
      if (isHandlingAuthError.current) return;
      isHandlingAuthError.current = true;
      try {
        await signOut();
      } catch (error) {
        console.error("Sign out after auth error failed:", error);
      } finally {
        queryClient.clear();
        await clientPersister.removeClient();
        router.replace("/(auth)");
        isHandlingAuthError.current = false;
      }
    });

    setReady(true);
  }, [isLoaded, isSignedIn, getToken, router, signOut]);

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn) {
      if (!inAuthGroup && pathname !== "/(auth)") {
        router.replace("/(auth)");
      }
      return;
    }

    if (inAuthGroup || pathname === "/") {
      router.replace("/(tabs)/home");
    }
  }, [isLoaded, isSignedIn, segments, router, pathname]);

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

function RootLayoutContent() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useThemeMode();

  const resolvedSystemScheme = systemColorScheme === "dark" ? "dark" : "light";

  const theme =
    themeMode === "system"
      ? resolvedSystemScheme === "dark"
        ? darkTheme
        : lightTheme
      : themeMode === "dark"
        ? darkTheme
        : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: clientPersister }}
        >
          <ClerkProvider
            publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            tokenCache={tokenCache}
          >
            <AuthBootstrapGate />
          </ClerkProvider>
        </PersistQueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeModeProvider>
      <RootLayoutContent />
    </ThemeModeProvider>
  );
}
