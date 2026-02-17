import { getResponseError } from "@/src/api/axios";
import { useGetPlanting } from "@/src/api/queries/plantings/useGetPlanting";
import { Screen } from "@/src/components/Screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";

export default function PlantingRedirectScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { plantingId } = useLocalSearchParams<{
    plantingId?: string | string[];
  }>();
  const resolvedPlantingId = Array.isArray(plantingId)
    ? plantingId[0]
    : plantingId;
  const router = useRouter();
  const plantingQuery = useGetPlanting(resolvedPlantingId ?? null);

  useEffect(() => {
    if (!plantingQuery.data || !resolvedPlantingId) return;
    const bedId = plantingQuery.data.bedId;
    if (!bedId) return;
    router.replace(`/(tabs)/beds/${bedId}/plantings/${resolvedPlantingId}`);
  }, [plantingQuery.data, resolvedPlantingId, router]);

  if (plantingQuery.isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (plantingQuery.error || !plantingQuery.data) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {String(getResponseError(plantingQuery.error))}
          </Text>
          <Button mode="outlined" onPress={() => plantingQuery.refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
