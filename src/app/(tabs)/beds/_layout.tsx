import { Stack } from "expo-router";

export default function BedsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Grządki" }} />
      <Stack.Screen name="new" options={{ title: "Nowa grządka" }} />
      <Stack.Screen name="[bedId]" options={{ title: "Szczegóły" }} />
      <Stack.Screen name="[bedId]/edit" options={{ title: "Edytuj grządkę" }} />
      <Stack.Screen name="soils" options={{ title: "Wybierz glebę" }} />
      <Stack.Screen name="garden" options={{ title: "Ogród" }} />
    </Stack>
  );
}
