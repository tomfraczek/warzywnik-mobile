import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <Stack
        screenOptions={({ route }) => {
          const segment = route.name;

          return {
            headerTitle:
              segment === "(auth)"
                ? "Logowanie"
                : segment === "(home)"
                ? "Start"
                : "Aplikacja",
          };
        }}
      />
    </ClerkProvider>
  );
}
