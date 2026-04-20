import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { MD3Theme, useTheme } from "react-native-paper";

export default function TabsLayout() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();

  const makeTabListener = (root: Parameters<typeof router.replace>[0]) => ({
    tabPress: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      router.replace(root);
    },
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor:
          theme.colors.onSurfaceVariant ?? theme.colors.secondary,
      }}
    >
      <Tabs.Screen
        name="home"
        listeners={makeTabListener("/(tabs)/home")}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="beds"
        listeners={makeTabListener("/(tabs)/beds")}
        options={{
          title: "Grządki",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        listeners={makeTabListener("/(tabs)/planner")}
        options={{
          title: "Kalendarz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="education"
        listeners={makeTabListener("/(tabs)/education")}
        options={{
          title: "Biblioteka",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={makeTabListener("/(tabs)/profile")}
        options={{
          title: "Konto",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
