// app/_layout.tsx (albo odpowiedni RootLayout w Twoim projekcie)

import { setAuthErrorHandler, setAuthTokenProvider } from "@/src/api/axios";
import { AuthFlowLoader } from "@/src/components/AuthFlowLoader";
import { OfflineBanner } from "@/src/components/OfflineBanner";
import { isSsoAuthInProgress } from "@/src/features/push/authFlowState";
import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
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

const FORCE_AUTH_FLOW_LOADER_FOR_TESTS = false;

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

    primary: "#8CC7A2",
    onPrimary: "#0F2218",
    secondary: "#6EA487",
    onSecondary: "#08160F",
    tertiary: "#C6AA72",
    onTertiary: "#1A1406",

    background: "#111714",
    onBackground: "#E6EEE9",
    surface: "#18211C",
    onSurface: "#E6EEE9",
    surfaceVariant: "#243029",
    onSurfaceVariant: "#B5C7BC",

    outline: "#33433A",
    outlineVariant: "#2B3831",
    error: "#FF8C82",
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
    const ssoInProgress = isSsoAuthInProgress();

    if (!isSignedIn) {
      if (ssoInProgress) {
        return;
      }
      if (!inAuthGroup && pathname !== "/(auth)") {
        router.replace("/(auth)");
      }
      return;
    }

    if (inAuthGroup || pathname === "/") {
      router.replace("/(tabs)/home");
    }
  }, [isLoaded, isSignedIn, segments, router, pathname]);

  if (FORCE_AUTH_FLOW_LOADER_FOR_TESTS) {
    return <AuthFlowLoader />;
  }

  if (!ready || (!isSignedIn && isSsoAuthInProgress())) {
    return <AuthFlowLoader />;
  }

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
  const lastHandledNotificationId = useRef<string | null>(null);

  const resolvedSystemScheme = systemColorScheme === "dark" ? "dark" : "light";

  const theme =
    themeMode === "system"
      ? resolvedSystemScheme === "dark"
        ? darkTheme
        : lightTheme
      : themeMode === "dark"
        ? darkTheme
        : lightTheme;

  const handleNotificationNavigation = useCallback(
    (data?: Record<string, unknown> | null, id?: string) => {
      if (id && lastHandledNotificationId.current === id) return;

      const kindRaw = data?.kind;
      const kind = typeof kindRaw === "string" ? kindRaw : null;

      const plantingRaw = data?.plantingId;
      const plantingId =
        typeof plantingRaw === "string"
          ? plantingRaw
          : typeof plantingRaw === "number"
            ? String(plantingRaw)
            : null;

      const bedRaw = data?.bedId;
      const bedId =
        typeof bedRaw === "string"
          ? bedRaw
          : typeof bedRaw === "number"
            ? String(bedRaw)
            : null;

      const actionTaskRaw = data?.actionTaskId;
      const actionTaskId =
        typeof actionTaskRaw === "string"
          ? actionTaskRaw
          : typeof actionTaskRaw === "number"
            ? String(actionTaskRaw)
            : null;

      if (kind === "action") {
        if (plantingId) {
          const suffix = actionTaskId ? `?actionTaskId=${actionTaskId}` : "";
          router.push(`/plantings/${plantingId}${suffix}`);
          if (id) {
            lastHandledNotificationId.current = id;
          }
          return;
        }

        if (bedId) {
          const suffix = actionTaskId ? `?actionTaskId=${actionTaskId}` : "";
          router.push(`/(tabs)/beds/${bedId}${suffix}`);
          if (id) {
            lastHandledNotificationId.current = id;
          }
          return;
        }
      }

      if (!plantingId) return;
      if (id) {
        lastHandledNotificationId.current = id;
      }
      router.push(`/plantings/${plantingId}`);
    },
    [router],
  );

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
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
      (response) => {
        const data = response.notification.request.content.data as Record<
          string,
          unknown
        > | null;
        const id = response.notification.request.identifier;
        handleNotificationNavigation(data, id);
      },
    );

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      > | null;
      const id = response.notification.request.identifier;
      handleNotificationNavigation(data, id);
    });

    return () => {
      receiveSub.remove();
      responseSub.remove();
    };
  }, [handleNotificationNavigation]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar
          style={theme.dark ? "light" : "dark"}
          backgroundColor={theme.colors.background}
        />
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: clientPersister,
            maxAge: 1000 * 60 * 60 * 24,
            dehydrateOptions: {
              shouldDehydrateMutation: () => false,
            },
          }}
        >
          <ClerkProvider
            publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
            tokenCache={tokenCache}
          >
            <AuthBootstrapGate />
          </ClerkProvider>
        </PersistQueryClientProvider>
        <OfflineBanner />
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
