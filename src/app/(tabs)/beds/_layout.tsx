import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Stack } from "expo-router";

export default function BedsLayout() {
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
        options={{ title: "Grządki", headerShown: false }}
      />
      <Stack.Screen name="new" options={{ title: "Nowa grządka" }} />
      <Stack.Screen name="[bedId]" options={{ title: "Szczegóły" }} />
      <Stack.Screen name="[bedId]/edit" options={{ title: "Edytuj grządkę" }} />
      <Stack.Screen
        name="[bedId]/plantings/new"
        options={{ title: "Nowa uprawa" }}
      />
      <Stack.Screen
        name="[bedId]/plantings/[plantingId]"
        options={{
          title: "Szczegóły uprawy",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[bedId]/plantings/[plantingId]/edit"
        options={{ title: "Edytuj uprawę" }}
      />
      <Stack.Screen
        name="[bedId]/plantings/[plantingId]/harvest-results"
        options={{ title: "Wyniki zbiorów" }}
      />
      <Stack.Screen name="soils" options={{ title: "Wybierz glebę" }} />
      <Stack.Screen name="vegetables" options={{ title: "Wybierz warzywo" }} />
      <Stack.Screen name="garden" options={{ title: "Ogród" }} />
    </Stack>
  );
}
