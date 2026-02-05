import { Stack } from "expo-router";

export default function BedsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Grządki" }} />
      <Stack.Screen name="new" options={{ title: "Nowa grządka" }} />
      <Stack.Screen name="[bedId]" options={{ title: "Szczegóły" }} />
      <Stack.Screen name="[bedId]/edit" options={{ title: "Edytuj grządkę" }} />
      <Stack.Screen
        name="[bedId]/plantings/new"
        options={{ title: "Nowa uprawa" }}
      />
      <Stack.Screen
        name="[bedId]/plantings/[plantingId]"
        options={{ title: "Szczegóły uprawy" }}
      />
      <Stack.Screen
        name="[bedId]/plantings/[plantingId]/edit"
        options={{ title: "Edytuj uprawę" }}
      />
      <Stack.Screen name="soils" options={{ title: "Wybierz glebę" }} />
      <Stack.Screen name="vegetables" options={{ title: "Wybierz warzywo" }} />
      <Stack.Screen name="garden" options={{ title: "Ogród" }} />
    </Stack>
  );
}
