import { setAuthErrorHandler, setAuthTokenProvider } from "@/src/api/axios";
import { ClerkProvider, useAuth, useClerk } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { clientPersister, queryClient } from "../api/queryClient";

function AuthBootstrapGate() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const isHandlingAuthError = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return; // czekaj aż Clerk się zainicjalizuje
    // ustaw globalny provider: każdy request pobierze ŚWIEŻY token
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

  if (!ready) return null; // blokuj render do czasu podpięcia providera
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
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
