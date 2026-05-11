import { BedSeasonHistorySection } from "@/src/app/(tabs)/beds/_components/BedSeasonHistorySection";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { MD3Theme, Text, useTheme } from "react-native-paper";

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    innerBg: dark ? "#161C19" : "#F3F6F2",
  };
}

export default function BedHistoryScreen() {
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const styles = makeStyles(theme);
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <CustomHeader
        title="Historia upraw"
        showBack
        backRoute={
          resolvedBedId ? `/(tabs)/beds/${resolvedBedId}` : "/(tabs)/beds"
        }
      />
      <ScrollView contentContainerStyle={styles.container}>
        {resolvedBedId ? (
          <BedSeasonHistorySection bedId={resolvedBedId} />
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historia upraw</Text>
            <Text style={styles.valueText}>Brak danych grządki.</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) => {
  const palette = buildPalette(theme.dark);
  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
      backgroundColor: palette.background,
    },
    section: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 22,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: palette.heading,
      marginBottom: 12,
    },
    valueText: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondary,
      marginTop: 8,
    },
  });
};
