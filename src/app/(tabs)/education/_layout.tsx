import { Stack } from "expo-router";

export default function EducationLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Edukacja" }} />
      <Stack.Screen name="articles/index" options={{ title: "Artykuły" }} />
      <Stack.Screen name="[slug]" options={{ title: "Artykuł" }} />
      <Stack.Screen name="vegetables/index" options={{ title: "Warzywa" }} />
      <Stack.Screen name="vegetables/[id]" options={{ title: "Warzywo" }} />
      <Stack.Screen name="soils/index" options={{ title: "Gleby" }} />
      <Stack.Screen name="soils/[id]" options={{ title: "Gleba" }} />
      <Stack.Screen name="pests/index" options={{ title: "Szkodniki" }} />
      <Stack.Screen name="pests/[id]" options={{ title: "Szkodnik" }} />
      <Stack.Screen name="diseases/index" options={{ title: "Choroby" }} />
      <Stack.Screen name="diseases/[id]" options={{ title: "Choroba" }} />
      <Stack.Screen name="fertilizers/index" options={{ title: "Nawozy" }} />
      <Stack.Screen name="fertilizers/[id]" options={{ title: "Nawóz" }} />
    </Stack>
  );
}
