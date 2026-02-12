import { Screen } from "@/src/components/Screen";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { MD3Theme, useTheme } from "react-native-paper";
import { ListRow } from "./_components/ListRow";

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
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>Edukacja</Text>
        <View style={styles.list}>
          {sections.map((section) => (
            <ListRow
              key={section.title}
              title={section.title}
              subtitle={section.subtitle}
              onPress={() => router.push(section.route)}
            />
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
      padding: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 16,
      color: theme.colors.onBackground,
    },
    list: {
      gap: 12,
    },
  });
