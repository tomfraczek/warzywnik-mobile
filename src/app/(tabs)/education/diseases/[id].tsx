import { getResponseError } from "@/src/api/axios";
import { useGetDisease } from "@/src/api/queries/diseases/useGetDisease";
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

export default function DiseaseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: disease,
    isLoading,
    error,
    refetch,
  } = useGetDisease(id ?? null);
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !disease) {
    return (
      <Screen>
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
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{disease.name}</Text>
        <SectionBlock title="Opis" text={disease.description ?? null} />
        <SectionBlock title="Objawy" items={disease.symptoms ?? null} />
        <SectionBlock title="Leczenie" items={disease.treatment ?? null} />
        <SectionBlock title="Zapobieganie" items={disease.prevention ?? null} />
        <SectionBlock
          title="Rośliny podatne"
          items={disease.affectedPlants ?? null}
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
