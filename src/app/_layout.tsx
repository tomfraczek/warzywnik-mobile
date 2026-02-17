// app/_layout.tsx (albo odpowiedni RootLayout w Twoim projekcie)

import {
  restClient,
  setAuthErrorHandler,
  setAuthTokenProvider,
} from "@/src/api/axios";
import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
  Snackbar,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { clientPersister, queryClient } from "../api/queryClient";
import { SettingsProvider, useSettings } from "../context/SettingsProvider";

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Primary brand (botanical green)
    primary: "#2F6B4F",
    onPrimary: "#FFFFFF",

    // Secondary (sage/leaf)
    secondary: "#7DAA8A",
    onSecondary: "#0F241A",

    // Tertiary (warm sun accent)
    tertiary: "#E2B458",
    onTertiary: "#1A1406",

    // Backgrounds / surfaces (soft, garden-like)
    background: "#F3F7F3",
    onBackground: "#1B1F1C",

    surface: "#FFFFFF",
    onSurface: "#1B1F1C",

    surfaceVariant: "#E6EFE7",
    onSurfaceVariant: "#33443A",

    // Borders / dividers
    outline: "#C9D7CC",
    outlineVariant: "#DDE7DF",

    // Utility
    error: "#C43D2F",
    onError: "#FFFFFF",

    // Optional: subtle elevation overlay for cards (Paper uses it in some components)
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: "#F7FAF7",
      level2: "#F2F7F3",
      level3: "#EDF4EE",
      level4: "#E8F1EA",
      level5: "#E3EEE6",
    },
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
  const { themeMode } = useSettings();
  const router = useRouter();
  const [notificationBanner, setNotificationBanner] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  const resolvedSystemScheme = systemColorScheme === "dark" ? "dark" : "light";

  const theme =
    themeMode === "system"
      ? resolvedSystemScheme === "dark"
        ? darkTheme
        : lightTheme
      : themeMode === "dark"
        ? darkTheme
        : lightTheme;

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const receiveSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const title = notification.request.content.title ?? "";
        const body = notification.request.content.body ?? "";
        const message = [title, body].filter(Boolean).join(" — ").trim();
        if (message.length > 0) {
          setNotificationBanner({ visible: true, message });
        }
      },
    );

    const responseSub = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        const data = response.notification.request.content.data ?? {};
        const plantingId =
          typeof data.plantingId === "string" ? data.plantingId : null;
        const bedId = typeof data.bedId === "string" ? data.bedId : null;

        if (!plantingId) return;

        let resolvedBedId = bedId;
        if (!resolvedBedId) {
          try {
            const result = await restClient.get(`/plantings/${plantingId}`);
            resolvedBedId = result.data?.bedId ?? null;
          } catch (error) {
            console.error("Failed to resolve bedId for notification", error);
          }
        }

        if (resolvedBedId) {
          router.push(`/(tabs)/beds/${resolvedBedId}/plantings/${plantingId}`);
        }
      },
    );

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, [router]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar
          style={theme.dark ? "light" : "dark"}
          backgroundColor={theme.colors.background}
        />
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
        <Snackbar
          visible={notificationBanner.visible}
          onDismiss={() =>
            setNotificationBanner({ visible: false, message: "" })
          }
          duration={3000}
        >
          {notificationBanner.message}
        </Snackbar>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RootLayoutContent />
    </SettingsProvider>
  );
}
