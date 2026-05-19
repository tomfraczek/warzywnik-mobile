import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Stack } from "expo-router";

export default function ProfileLayout() {
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
        options={{ title: "Profil", headerShown: false }}
      />
      <Stack.Screen
        name="profile-edit"
        options={{ title: "Edycja profilu", headerShown: false }}
      />
    </Stack>
  );
}
