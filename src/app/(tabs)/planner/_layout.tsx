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
        options={{ title: "Kalendarz", headerShown: false }}
      />
      <Stack.Screen
        name="tasks"
        options={{
          title: "Lista zadań",
          header: ({ options }) => (
            <CustomHeader
              title={options.title?.toString()}
              showBack
              backRoute="/(tabs)/planner"
            />
          ),
        }}
      />
      <Stack.Screen name="calendar" options={{ title: "Kalendarz" }} />
    </Stack>
  );
}
