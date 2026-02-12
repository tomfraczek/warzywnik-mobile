import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Stack } from "expo-router";

export default function PlannerLayout() {
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
        options={{ title: "Planer", headerShown: false }}
      />
      <Stack.Screen name="calendar" options={{ title: "Kalendarz" }} />
    </Stack>
  );
}
