import { Stack } from "expo-router";

export default function PlannerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Planer" }} />
      <Stack.Screen name="calendar" options={{ title: "Kalendarz" }} />
    </Stack>
  );
}
