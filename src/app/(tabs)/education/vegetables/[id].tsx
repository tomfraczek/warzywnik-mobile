import { getResponseError } from "@/src/api/axios";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, MD3Theme, useTheme } from "react-native-paper";
import { SectionBlock } from "../_components/SectionBlock";

export default function VegetableDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: vegetable,
    isLoading,
    error,
    refetch,
  } = useGetVegetable(id ?? null);
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const sowingMethods = useMemo(() => {
    return vegetable?.sowingMethods?.map((method) => {
      const parts = [
        `Metoda: ${method.method}`,
        `Okres: ${method.startMonth} - ${method.endMonth}`,
        method.underCover ? "Pod osłonami" : "W gruncie",
        method.seedDepthCm
          ? `Głębokość nasion: ${method.seedDepthCm} cm`
          : null,
        method.rowSpacingCm
          ? `Rozstawa rzędów: ${method.rowSpacingCm} cm`
          : null,
        method.plantSpacingCm
          ? `Odstęp roślin: ${method.plantSpacingCm} cm`
          : null,
        method.germinationDaysMin || method.germinationDaysMax
          ? `Kiełkowanie: ${method.germinationDaysMin ?? "?"} - ${method.germinationDaysMax ?? "?"} dni`
          : null,
        method.transplantingStartMonth || method.transplantingEndMonth
          ? `Pikowanie: ${method.transplantingStartMonth ?? "?"} - ${method.transplantingEndMonth ?? "?"}`
          : null,
      ].filter(Boolean);

      return parts.join(" • ");
    });
  }, [vegetable?.sowingMethods]);

  const fertilizationStages = useMemo(() => {
    return vegetable?.fertilizationStages?.map((stage) => {
      const timing = stage.timing ? ` (${stage.timing})` : "";
      return `${stage.name}${timing}: ${stage.description}`;
    });
  }, [vegetable?.fertilizationStages]);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (error || !vegetable) {
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

  const harvestRange =
    vegetable.timeToHarvestDaysMin || vegetable.timeToHarvestDaysMax
      ? `${vegetable.timeToHarvestDaysMin ?? "?"}-${vegetable.timeToHarvestDaysMax ?? "?"} dni`
      : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        {vegetable.imageUrl ? (
          <Image
            source={{ uri: vegetable.imageUrl }}
            contentFit="cover"
            style={styles.image}
          />
        ) : null}
        <Text style={styles.title}>{vegetable.name}</Text>
        {vegetable.latinName ? (
          <Text style={styles.subtitle}>{vegetable.latinName}</Text>
        ) : null}

        <SectionBlock title="Opis" text={vegetable.description} />
        <SectionBlock title="Wymagania świetlne" text={vegetable.sunExposure} />
        <SectionBlock
          title="Zapotrzebowanie na wodę"
          text={vegetable.waterDemand}
        />
        <SectionBlock
          title="Zapotrzebowanie na składniki"
          text={vegetable.nutrientDemand}
        />
        <SectionBlock
          title="Minimalna głębokość gleby"
          text={
            vegetable.minSoilDepthCm ? `${vegetable.minSoilDepthCm} cm` : null
          }
        />
        <SectionBlock title="Czas do zbioru" text={harvestRange} />
        <SectionBlock title="Oznaki zbioru" text={vegetable.harvestSigns} />
        <SectionBlock title="Sposoby siewu" items={sowingMethods ?? null} />
        <SectionBlock
          title="Etapy nawożenia"
          items={fertilizationStages ?? null}
        />
        <SectionBlock
          title="Wspólne szkodniki"
          items={vegetable.commonPests?.map((item) => item.name) ?? null}
        />
        <SectionBlock
          title="Wspólne choroby"
          items={vegetable.commonDiseases?.map((item) => item.name) ?? null}
        />
        <SectionBlock
          title="Dobre sąsiedztwo"
          items={vegetable.goodCompanions?.map((item) => item.name) ?? null}
        />
        <SectionBlock
          title="Złe sąsiedztwo"
          items={vegetable.badCompanions?.map((item) => item.name) ?? null}
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
      marginBottom: 4,
      color: theme.colors.onBackground,
    },
    image: {
      width: "100%",
      height: 180,
      borderRadius: 16,
      marginBottom: 16,
      backgroundColor: theme.colors.surfaceVariant,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
