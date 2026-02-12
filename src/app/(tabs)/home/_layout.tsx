import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        header: ({ options }) => (
          <CustomHeader title={options.title?.toString()} />
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: "Home" }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Ustawienia", headerBackTitle: "Home" }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{ headerShown: false, title: "Edycja profilu" }}
      />
      <Stack.Screen
        name="export-data"
        options={{ title: "Eksport danych", headerBackTitle: "Ustawienia" }}
      />
      <Stack.Screen
        name="delete-account"
        options={{ title: "Usuń konto", headerBackTitle: "Ustawienia" }}
      />
    </Stack>
  );
}
