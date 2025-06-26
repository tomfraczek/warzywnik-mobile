import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { clientPersister, queryClient } from "../api/queryClient";
import { ClerkAuthProvider } from "../context/ClerkAuthProvider";
import { ReactQueryProvider } from "../context/ReactQueryProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ReactQueryProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: clientPersister }}
        >
          <ClerkProvider tokenCache={tokenCache}>
            <ClerkAuthProvider>
              <Stack
                screenOptions={({ route }) => {
                  const segment = route?.name ?? "";

                  const headerTitle = segment.includes("(auth)")
                    ? "Logowanie"
                    : segment.includes("(home)")
                    ? "Start"
                    : "Aplikacja";

                  return { headerTitle };
                }}
              />
            </ClerkAuthProvider>
          </ClerkProvider>
        </PersistQueryClientProvider>
      </ReactQueryProvider>
    </SafeAreaProvider>
  );
}
