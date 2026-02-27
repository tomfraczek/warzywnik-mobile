import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { spacing } from "@/src/theme/ui";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MD3Theme, TextInput, useTheme } from "react-native-paper";

const sections = [
  {
    title: "Artykuły",
    subtitle: "Poradniki i praktyczne wskazówki",
    route: "/(tabs)/education/articles",
  },
  {
    title: "Warzywa",
    subtitle: "Odmiany, wymagania, uprawa",
    route: "/(tabs)/education/vegetables",
  },
  {
    title: "Gleby",
    subtitle: "Typy gleb i ich właściwości",
    route: "/(tabs)/education/soils",
  },
  {
    title: "Szkodniki",
    subtitle: "Rozpoznawanie i zapobieganie",
    route: "/(tabs)/education/pests",
  },
  {
    title: "Choroby",
    subtitle: "Objawy i metody ochrony",
    route: "/(tabs)/education/diseases",
  },
  {
    title: "Nawozy",
    subtitle: "Rodzaje i zastosowanie",
    route: "/(tabs)/education/fertilizers",
  },
];

export default function EducationScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const [query, setQuery] = useState("");

  const filteredSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sections;
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(needle) ||
        section.subtitle.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <Screen safeAreaEdges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.title}>Biblioteka</Text>
        <Text style={styles.subtitle}>
          Przeszukuj wiedzę o uprawach, glebach i ochronie roślin
        </Text>

        <TextInput
          mode="outlined"
          value={query}
          onChangeText={setQuery}
          placeholder="Szukaj w bibliotece"
          style={styles.search}
          left={<TextInput.Icon icon="magnify" />}
        />

        <View style={styles.list}>
          {filteredSections.map((section) => (
            <Pressable
              key={section.title}
              onPress={() => router.push(section.route)}
            >
              <Card>
                <Text style={styles.cardTitle}>{section.title}</Text>
                <Text style={styles.cardSubtitle}>{section.subtitle}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.md,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    search: {
      marginBottom: spacing.md,
      backgroundColor: theme.colors.surface,
    },
    list: {
      gap: spacing.sm,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    cardSubtitle: {
      marginTop: spacing.xs,
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
  });
