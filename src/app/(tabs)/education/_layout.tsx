import CustomHeader from "@/src/components/navigation/CustomHeader";
import { Stack, useLocalSearchParams } from "expo-router";

function ArticleDetailsHeader() {
  const { fromHome } = useLocalSearchParams<{ fromHome?: string }>();
  return (
    <CustomHeader
      title="Artykuł"
      backRoute={fromHome ? "/(tabs)/home" : undefined}
    />
  );
}

export default function EducationLayout() {
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
        options={{ title: "Biblioteka", headerShown: false }}
      />
      <Stack.Screen name="favorites" options={{ title: "Ulubione" }} />
      <Stack.Screen name="articles/index" options={{ title: "Artykuły" }} />
      <Stack.Screen
        name="articles/[id]"
        options={{ header: () => <ArticleDetailsHeader /> }}
      />
      <Stack.Screen name="[slug]" options={{ title: "Artykuł" }} />
      <Stack.Screen name="vegetables/index" options={{ title: "Warzywa" }} />
      <Stack.Screen
        name="vegetables/[id]"
        options={{
          title: "Warzywo",
          headerTransparent: true,
          header: () => <CustomHeader title="Warzywo" variant="overlay" />,
        }}
      />
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
