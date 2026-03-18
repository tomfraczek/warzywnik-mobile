import { getResponseError } from "@/src/api/axios";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { spacing } from "@/src/theme/ui";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Button, MD3Theme, Text, useTheme } from "react-native-paper";
import { SectionBlock } from "../_components/SectionBlock";

const mapBotanicalFamilyLabel = (value: string | null | undefined) => {
  if (!value) return null;
  const labels: Record<string, string> = {
    SOLANACEAE: "Psiankowate",
    CUCURBITACEAE: "Dyniowate",
    BRASSICACEAE: "Kapustowate",
    AMARYLLIDACEAE: "Amarylkowate",
    APIACEAE: "Selerowate",
    FABACEAE: "Bobowate",
    AMARANTHACEAE: "Szarłatowate",
    ASTERACEAE: "Astrowate",
    ASPARAGACEAE: "Szparagowate",
    POLYGONACEAE: "Rdestowate",
    MALVACEAE: "Ślazowate",
    POACEAE: "Wiechlinowate",
  };
  return labels[value] ?? value;
};

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
        <Card>
          <Text style={styles.title}>{vegetable.name}</Text>
          {vegetable.latinName ? (
            <Text style={styles.subtitle}>{vegetable.latinName}</Text>
          ) : null}
        </Card>

        <SectionBlock title="Opis" text={vegetable.description} />
        <SectionBlock
          title="Rodzina botaniczna"
          text={mapBotanicalFamilyLabel(vegetable.botanicalFamily)}
        />
        <SectionBlock title="Warunki uprawy" text={vegetable.sunExposure} />
        <SectionBlock
          title="Wymagania glebowe"
          text={vegetable.nutrientDemand}
        />
        <SectionBlock title="Termin siewu" items={sowingMethods ?? null} />
        <SectionBlock title="Termin zbioru" text={harvestRange} />
        <SectionBlock
          title="Sąsiedztwo"
          items={vegetable.goodCompanions?.map((item) => item.name) ?? null}
        />
        <SectionBlock
          title="Ostrzeżenia"
          items={(vegetable.commonPests?.map((item) => item.name) ?? []).concat(
            vegetable.commonDiseases?.map((item) => item.name) ?? [],
          )}
        />
        <SectionBlock
          title="Powiązane artykuły"
          items={fertilizationStages ?? null}
        />
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: 32,
      gap: spacing.sm,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    image: {
      width: "100%",
      height: 220,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceVariant,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 12,
      textAlign: "center",
    },
  });
