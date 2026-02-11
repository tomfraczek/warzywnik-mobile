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

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Option A (Natural, calm)
    primary: "#4C7A5A",
    secondary: "#A3B18A",
    tertiary: "#E9C46A",

    background: "#F4F6F3",
    surface: "#FFFFFF",

    error: "#E63946",

    // Good to set explicitly for consistency
    onPrimary: "#FFFFFF",
    onSecondary: "#1E1E1E",
    onTertiary: "#1E1E1E",
    onBackground: "#2B2B2B",
    onSurface: "#2B2B2B",

    outline: "#D6DAD5",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    // Dark counterpart (aligned with Option A)
    primary: "#6B9C7C",
    secondary: "#B9C6A3",
    tertiary: "#F0D58A",

    background: "#121212",
    surface: "#1A1A1A",

    error: "#FF6B6B",

    onPrimary: "#0B1F14",
    onSecondary: "#0E160F",
    onTertiary: "#2A2008",
    onBackground: "#E6E6E6",
    onSurface: "#E6E6E6",

    outline: "#3A3A3A",
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
  }, [isLoaded, getToken, router, signOut]);

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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: clientPersister }}
        >
          <ClerkProvider tokenCache={tokenCache}>
            <AuthBootstrapGate />
          </ClerkProvider>
        </PersistQueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
