import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";

export default function TabsLayout() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        tabBarButton: (props) => (
          <TouchableOpacity {...props} activeOpacity={1} />
        ),
        tabBarPressColor: "transparent",
        tabBarPressOpacity: 1,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor:
          theme.colors.onSurfaceVariant ?? theme.colors.secondary,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="beds"
        options={{
          title: "Grządki",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sprout" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: "Kalendarz",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="education"
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            if (!navigation.isFocused()) return;
            event.preventDefault();
            router.replace("/(tabs)/education");
          },
        })}
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
