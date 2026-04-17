import { getResponseError } from "@/src/api/axios";
import { useGetSoil } from "@/src/api/queries/soils/useGetSoil";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import { SectionBlock } from "../_components/SectionBlock";

export default function SoilDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: soil, isLoading, error, refetch } = useGetSoil(id ?? null);
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  if (isLoading) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !soil) {
    return (
      <Screen safeAreaEdges={["left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(error))}
          </Text>
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{soil.name}</Text>
        <SectionBlock title="Opis" text={soil.description ?? null} />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 32,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: "600",
      marginBottom: 12,
      color: theme.colors.onBackground,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
