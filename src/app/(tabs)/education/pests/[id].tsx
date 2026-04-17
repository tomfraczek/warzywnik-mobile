import { getResponseError } from "@/src/api/axios";
import { useGetPest } from "@/src/api/queries/pests/useGetPest";
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

export default function PestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: pest, isLoading, error, refetch } = useGetPest(id ?? null);
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

  if (error || !pest) {
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
        <Text style={styles.title}>{pest.name}</Text>
        <SectionBlock title="Opis" text={pest.description ?? null} />
        <SectionBlock title="Objawy" items={pest.symptoms ?? null} />
        <SectionBlock title="Zwalczanie" items={pest.treatment ?? null} />
        <SectionBlock title="Zapobieganie" items={pest.prevention ?? null} />
        <SectionBlock
          title="Rośliny żywicielskie"
          items={pest.affectedPlants ?? null}
        />
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
