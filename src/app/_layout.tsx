// app/_layout.tsx (albo odpowiedni RootLayout w Twoim projekcie)

import { setAuthErrorHandler, setAuthTokenProvider } from "@/src/api/axios";
import { AuthFlowLoader } from "@/src/components/AuthFlowLoader";
import { LocationSetupRequiredModal } from "@/src/components/location/LocationSetupRequiredModal";
import { OfflineBanner } from "@/src/components/OfflineBanner";
import { isSsoAuthInProgress } from "@/src/features/push/authFlowState";
import { usePushNotificationListeners } from "@/src/features/push/usePushNotificationListeners";
import { usePushNotificationsLifecycle } from "@/src/features/push/usePushNotificationsLifecycle";
import { ClerkProvider, useAuth, useClerk, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useColorScheme, View } from "react-native";

import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getMe } from "../api/queries/users/useUpdateMe";
import { clientPersister, queryClient } from "../api/queryClient";
import { SettingsProvider, useSettings } from "../context/SettingsProvider";

SplashScreen.preventAutoHideAsync();

const FORCE_AUTH_FLOW_LOADER_FOR_TESTS = false;

const deriveNameFromEmail = (email: string): string => {
  const localPart = email.split("@")[0] ?? "";
  const spaced = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!spaced) return "";

  return spaced
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
};

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
  const { user, isLoaded: isUserLoaded } = useUser();
  const {
    profile,
    setProfile,
    setThemeMode,
    isReady: areSettingsReady,
  } = useSettings();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const isHandlingAuthError = useRef(false);
  const wasSignedInRef = useRef(false);
  const hasBootstrappedThemeRef = useRef(false);
  const profileNameRef = useRef(profile.name);
  const [ready, setReady] = useState(false);
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    profileNameRef.current = profile.name;
  });

  useEffect(() => {
    setIsNavigationReady(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      if (wasSignedInRef.current) {
        wasSignedInRef.current = false;
        hasBootstrappedThemeRef.current = false;
        queryClient.clear();
        void clientPersister.removeClient();
        setProfile({ name: "", avatarId: null });
      }
      setAuthTokenProvider(async () => null);
      setReady(true);
      return;
    }

    wasSignedInRef.current = true;
    setAuthTokenProvider(async () => (await getToken()) ?? null);

    setAuthErrorHandler(async (_status) => {
      if (isHandlingAuthError.current) return;
      isHandlingAuthError.current = true;
      try {
        queryClient.clear();
        await clientPersister.removeClient();
        setProfile({ name: "", avatarId: null });
        await signOut();
      } catch (error) {
        console.error("Sign out after auth error failed:", error);
      } finally {
        isHandlingAuthError.current = false;
      }
    });

    setReady(true);
  }, [getToken, isLoaded, isSignedIn, setProfile, router, signOut]);

  useEffect(() => {
    if (!isSignedIn || !ready || hasBootstrappedThemeRef.current) return;

    hasBootstrappedThemeRef.current = true;

    getMe()
      .then((me) => {
        if (!me.themeMode) return;
        setThemeMode(me.themeMode);
      })
      .catch((err) => {
        console.warn("Failed to bootstrap themeMode from backend", err);
      });
  }, [isSignedIn, ready, setThemeMode]);

  useEffect(() => {
    if (!isLoaded || !isNavigationReady || !areSettingsReady) return;

    const inAuthGroup = segments[0] === "(auth)";
    const ssoInProgress = isSsoAuthInProgress();

    if (!isSignedIn) {
      if (ssoInProgress) {
        return;
      }
      if (!inAuthGroup) {
        router.replace("/(auth)");
      }
      void SplashScreen.hideAsync();
      return;
    }

    // Wait for Clerk user data before deciding where to navigate — otherwise
    // profile.name may be empty even though auto-fill will populate it shortly.
    if (!isUserLoaded) return;

    if (inAuthGroup || pathname === "/") {
      const hasClerkName = !!(
        user?.firstName?.trim() ||
        user?.fullName?.trim() ||
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress
      );
      const nameIsSet = profileNameRef.current.trim().length > 0;
      const shouldOpenProfileEdit = !nameIsSet && !hasClerkName;
      router.replace(
        shouldOpenProfileEdit ? "/(tabs)/profile/profile-edit" : "/(tabs)/home",
      );
    }

    void SplashScreen.hideAsync();
  }, [
    areSettingsReady,
    isLoaded,
    isNavigationReady,
    isSignedIn,
    isUserLoaded,
    pathname,
    router,
    segments,
    user?.emailAddresses,
    user?.firstName,
    user?.fullName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isUserLoaded || !areSettingsReady) return;
    if (profile.name.trim().length > 0) return;

    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      "";

    const candidate =
      user?.firstName?.trim() ||
      user?.fullName?.trim() ||
      deriveNameFromEmail(email);

    if (!candidate) return;

    setProfile({ name: candidate });
  }, [
    areSettingsReady,
    isLoaded,
    isSignedIn,
    isUserLoaded,
    profile.name,
    setProfile,
    user?.emailAddresses,
    user?.firstName,
    user?.fullName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  if (FORCE_AUTH_FLOW_LOADER_FOR_TESTS) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }} />
        <AuthFlowLoader />
      </>
    );
  }

  const shouldShowLoader = !ready || (!isSignedIn && isSsoAuthInProgress());

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {shouldShowLoader ? (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <AuthFlowLoader />
        </View>
      ) : null}
    </>
  );
}

function PushNotificationsLifecycleBridge() {
  usePushNotificationsLifecycle();
  return null;
}

function RootLayoutContent() {
  const systemColorScheme = useColorScheme();
  const { themeMode } = useSettings();
  usePushNotificationListeners();

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
            <PushNotificationsLifecycleBridge />
            <AuthBootstrapGate />
            <LocationSetupRequiredModal />
          </ClerkProvider>
        </PersistQueryClientProvider>
        <OfflineBanner />
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
