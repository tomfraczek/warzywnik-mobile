import { getResponseError } from "@/src/api/axios";
import {
  DemandLevel,
  DominantNutrientDemand,
  FertilizationStage,
  MiniRef,
  Month,
  SowingMethod,
  SowingMethodType,
  SunExposure,
  Vegetable,
} from "@/src/api/queries/vegetables/types";
import { useGetVegetable } from "@/src/api/queries/vegetables/useGetVegetable";
import { Screen } from "@/src/components/Screen";
import { FavoriteButton } from "@/src/components/ui/FavoriteButton";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Text, useTheme } from "react-native-paper";

// ─── palette (same system as list screen) ────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    surface: dark ? "#1D221F" : "#FFFFFF",
    border: dark ? "#2B332F" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#8DB89A" : "#5E8A70",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    familyTagBg: dark ? "#1F2E25" : "#EBF4EF",
    familyTagText: dark ? "#88B89A" : "#4A7A60",
    imagePlaceholderBg: dark ? "#1B2620" : "#EEF5F0",
    badgeBg: dark ? "#1E2821" : "#F0F4F1",
    badgeText: dark ? "#C4D5CA" : "#3D5448",
    goodBg: dark ? "#1A2E22" : "#EBF5EF",
    goodText: dark ? "#88B89A" : "#3A7A5A",
    badBg: dark ? "#2E1A1A" : "#FBF0EF",
    badText: dark ? "#C88A85" : "#9A4A45",
    innerCardBg: dark ? "#161C19" : "#F8FAF8",
    innerCardBorder: dark ? "#222B26" : "#EBF0EA",
  };
}

// ─── label mappers ────────────────────────────────────────────────────────────

const BOTANICAL_FAMILY_LABELS: Record<string, string> = {
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
  POACEAE: "Trawy",
};

const SUN_LABELS: Record<SunExposure, string> = {
  full_sun: "Pełne słońce",
  partial_shade: "Półcień",
  shade: "Cień",
};

const DEMAND_LABELS: Record<DemandLevel, string> = {
  low: "Niskie",
  medium: "Średnie",
  high: "Wysokie",
};

const NUTRIENT_LABELS: Record<DominantNutrientDemand, string> = {
  N: "Azot (N)",
  P: "Fosfor (P)",
  K: "Potas (K)",
  BALANCED: "Zrównoważone",
};

const SOWING_METHOD_LABELS: Record<SowingMethodType, string> = {
  direct_sow: "Siew bezpośredni",
  seedlings: "Rozsada",
};

const MONTH_LABELS: Record<Month, string> = {
  january: "Styczeń",
  february: "Luty",
  march: "Marzec",
  april: "Kwiecień",
  may: "Maj",
  june: "Czerwiec",
  july: "Lipiec",
  august: "Sierpień",
  september: "Wrzesień",
  october: "Październik",
  november: "Listopad",
  december: "Grudzień",
};

const monthLabel = (m: Month | null | undefined) =>
  m ? (MONTH_LABELS[m] ?? m) : null;

const slugToLabel = (slug: string) =>
  slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ─── skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <View
        style={{
          width: "100%",
          height: 280,
          backgroundColor: palette.imagePlaceholderBg,
        }}
      />
      <View
        style={{
          marginHorizontal: 16,
          marginTop: -28,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: palette.cardBorder,
          backgroundColor: palette.cardBg,
          padding: 20,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 90,
            height: 24,
            borderRadius: 999,
            backgroundColor: palette.innerCardBg,
          }}
        />
        <View
          style={{
            width: "65%",
            height: 32,
            borderRadius: 8,
            backgroundColor: palette.innerCardBg,
          }}
        />
        <View
          style={{
            width: "45%",
            height: 18,
            borderRadius: 6,
            backgroundColor: palette.innerCardBg,
          }}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 4,
          }}
        >
          {[80, 110, 90].map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: 32,
                borderRadius: 999,
                backgroundColor: palette.innerCardBg,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── presentational components ───────────────────────────────────────────────

function SectionCard({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        s.sectionCard,
        { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
      ]}
    >
      <Text style={[s.sectionTitle, { color: palette.heading }]}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  palette,
}: {
  label: string;
  value: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={[s.infoLabel, { color: palette.meta }]}>{label}</Text>
      <Text style={[s.infoValue, { color: palette.heading }]}>{value}</Text>
    </View>
  );
}

function Chip({
  label,
  bgColor,
  textColor,
}: {
  label: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <View style={[s.chip, { backgroundColor: bgColor }]}>
      <Text style={[s.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function SowingMethodCard({
  method,
  palette,
}: {
  method: SowingMethod;
  palette: ReturnType<typeof buildPalette>;
}) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Okres siewu",
      value: `${monthLabel(method.startMonth)} – ${monthLabel(method.endMonth)}`,
    },
    {
      label: "Miejsce",
      value: method.underCover ? "Pod osłonami" : "W gruncie",
    },
  ];
  if (method.seedDepthCm != null)
    rows.push({ label: "Głębokość nasion", value: `${method.seedDepthCm} cm` });
  if (method.rowSpacingCm != null)
    rows.push({ label: "Rozstawa rzędów", value: `${method.rowSpacingCm} cm` });
  if (method.plantSpacingCm != null)
    rows.push({ label: "Odstęp roślin", value: `${method.plantSpacingCm} cm` });
  if (method.germinationDaysMin != null || method.germinationDaysMax != null)
    rows.push({
      label: "Kiełkowanie",
      value: `${method.germinationDaysMin ?? "?"}–${method.germinationDaysMax ?? "?"} dni`,
    });
  if (method.transplantingStartMonth || method.transplantingEndMonth)
    rows.push({
      label: "Pikowanie",
      value: `${monthLabel(method.transplantingStartMonth) ?? "?"} – ${monthLabel(method.transplantingEndMonth) ?? "?"}`,
    });

  return (
    <View
      style={[
        s.innerCard,
        {
          backgroundColor: palette.innerCardBg,
          borderColor: palette.innerCardBorder,
        },
      ]}
    >
      <Text style={[s.innerCardTitle, { color: palette.accent }]}>
        {SOWING_METHOD_LABELS[method.method] ?? method.method}
      </Text>
      {rows.map((r) => (
        <InfoRow
          key={r.label}
          label={r.label}
          value={r.value}
          palette={palette}
        />
      ))}
    </View>
  );
}

function FertilizationStageCard({
  stage,
  palette,
}: {
  stage: FertilizationStage;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        s.innerCard,
        {
          backgroundColor: palette.innerCardBg,
          borderColor: palette.innerCardBorder,
        },
      ]}
    >
      <View style={s.innerCardHeader}>
        <Text style={[s.innerCardTitle, { color: palette.accent }]}>
          {stage.name}
        </Text>
        {stage.timing ? (
          <Text style={[s.innerCardMeta, { color: palette.meta }]}>
            {stage.timing}
          </Text>
        ) : null}
      </View>
      <Text style={[s.innerCardDesc, { color: palette.secondary }]}>
        {stage.description}
      </Text>
    </View>
  );
}

function CompanionSection({
  title,
  items,
  bgColor,
  textColor,
  palette,
}: {
  title: string;
  items: MiniRef[];
  bgColor: string;
  textColor: string;
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.companionGroup}>
      <Text style={[s.companionSubtitle, { color: palette.secondary }]}>
        {title}
      </Text>
      {items.length > 0 ? (
        <View style={s.chipRow}>
          {items.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              bgColor={bgColor}
              textColor={textColor}
            />
          ))}
        </View>
      ) : (
        <Text style={[s.emptyNote, { color: palette.meta }]}>Brak danych</Text>
      )}
    </View>
  );
}

function PestDiseaseChips({
  title,
  items,
  palette,
}: {
  title: string;
  items: MiniRef[];
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View style={s.companionGroup}>
      <Text style={[s.companionSubtitle, { color: palette.secondary }]}>
        {title}
      </Text>
      {items.length > 0 ? (
        <View style={s.chipRow}>
          {items.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              bgColor={palette.badgeBg}
              textColor={palette.badgeText}
            />
          ))}
        </View>
      ) : (
        <Text style={[s.emptyNote, { color: palette.meta }]}>Brak danych</Text>
      )}
    </View>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function VegetableDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: vegetable,
    isLoading,
    error,
    refetch,
  } = useGetVegetable(id ?? null);
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);

  if (isLoading) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <DetailSkeleton palette={palette} />
      </Screen>
    );
  }

  if (error || !vegetable) {
    return (
      <Screen
        style={{ backgroundColor: palette.background }}
        safeAreaEdges={["left", "right"]}
      >
        <View style={s.errorWrap}>
          <Icon source="alert-circle-outline" size={48} color="#C8776E" />
          <Text style={[s.errorText, { color: palette.secondary }]}>
            {error ? String(getResponseError(error)) : "Nie znaleziono warzywa"}
          </Text>
          <Button
            mode="outlined"
            onPress={() => refetch()}
            textColor={palette.accent}
          >
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { backgroundColor: palette.background },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── hero image ── */}
        <View style={s.heroImageWrap}>
          <View
            style={[
              s.heroImagePlaceholder,
              { backgroundColor: palette.imagePlaceholderBg },
            ]}
          >
            <Icon source="sprout-outline" size={56} color="#C0D5C8" />
          </View>
          {vegetable.imageUrl ? (
            <Image
              source={{ uri: vegetable.imageUrl }}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              transition={350}
            />
          ) : null}
        </View>

        {/* ── hero card (overlapping image) ── */}
        <View
          style={[
            s.heroCard,
            {
              backgroundColor: palette.cardBg,
              borderColor: palette.cardBorder,
            },
          ]}
        >
          {/* family tag + favorite */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {vegetable.botanicalFamily ? (
              <View
                style={[s.familyTag, { backgroundColor: palette.familyTagBg }]}
              >
                <Text
                  style={[s.familyTagText, { color: palette.familyTagText }]}
                >
                  {BOTANICAL_FAMILY_LABELS[vegetable.botanicalFamily] ??
                    vegetable.botanicalFamily}
                </Text>
              </View>
            ) : (
              <View />
            )}
            <FavoriteButton
              targetType="VEGETABLE"
              targetSlug={vegetable.slug}
              variant="inline"
              size={26}
              inactiveColor="#B0BAB5"
            />
          </View>

          {/* name */}
          <Text style={[s.vegetableName, { color: palette.heading }]}>
            {vegetable.name}
          </Text>

          {/* latin name */}
          {vegetable.latinName ? (
            <Text style={[s.latinName, { color: palette.meta }]}>
              {vegetable.latinName}
            </Text>
          ) : null}
        </View>

        {/* ── description ── */}
        {vegetable.description ? (
          <SectionCard title="Opis" palette={palette}>
            <Text style={[s.descText, { color: palette.secondary }]}>
              {vegetable.description}
            </Text>
          </SectionCard>
        ) : null}

        {/* ── key info grid ── */}
        <KeyInfoSection vegetable={vegetable} palette={palette} />

        {/* ── sowing & harvest ── */}
        <SowingHarvestSection vegetable={vegetable} palette={palette} />

        {/* ── fertilization ── */}
        {vegetable.fertilizationStages &&
        vegetable.fertilizationStages.length > 0 ? (
          <SectionCard title="Nawożenie" palette={palette}>
            <View style={s.innerList}>
              {vegetable.fertilizationStages.map((stage, i) => (
                <FertilizationStageCard
                  key={i}
                  stage={stage}
                  palette={palette}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        {/* ── recommended soils ── */}
        {vegetable.recommendedSoilIds &&
        vegetable.recommendedSoilIds.length > 0 ? (
          <SectionCard title="Zalecane gleby" palette={palette}>
            <View style={s.chipRow}>
              {vegetable.recommendedSoilIds.map((slug) => (
                <Chip
                  key={slug}
                  label={slugToLabel(slug)}
                  bgColor={palette.badgeBg}
                  textColor={palette.badgeText}
                />
              ))}
            </View>
          </SectionCard>
        ) : null}

        {/* ── pests & diseases ── */}
        {vegetable.commonPests.length > 0 ||
        vegetable.commonDiseases.length > 0 ? (
          <SectionCard title="Szkodniki i choroby" palette={palette}>
            <View style={s.innerList}>
              <PestDiseaseChips
                title="Najczęstsze szkodniki"
                items={vegetable.commonPests}
                palette={palette}
              />
              <PestDiseaseChips
                title="Najczęstsze choroby"
                items={vegetable.commonDiseases}
                palette={palette}
              />
            </View>
          </SectionCard>
        ) : null}

        {/* ── companions ── */}
        {vegetable.goodCompanions.length > 0 ||
        vegetable.badCompanions.length > 0 ? (
          <SectionCard title="Sąsiedztwo" palette={palette}>
            <View style={s.innerList}>
              <CompanionSection
                title="Dobre sąsiedztwo"
                items={vegetable.goodCompanions}
                bgColor={palette.goodBg}
                textColor={palette.goodText}
                palette={palette}
              />
              <CompanionSection
                title="Złe sąsiedztwo"
                items={vegetable.badCompanions}
                bgColor={palette.badBg}
                textColor={palette.badText}
                palette={palette}
              />
            </View>
          </SectionCard>
        ) : null}

        {/* ── metadata ── */}
        <View style={s.metaBlock}>
          {vegetable.createdAt ? (
            <Text style={[s.metaText, { color: palette.meta }]}>
              Dodano:{" "}
              {new Date(vegetable.createdAt).toLocaleDateString("pl-PL")}
            </Text>
          ) : null}
          {vegetable.updatedAt ? (
            <Text style={[s.metaText, { color: palette.meta }]}>
              Zaktualizowano:{" "}
              {new Date(vegetable.updatedAt).toLocaleDateString("pl-PL")}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── section sub-components ───────────────────────────────────────────────────

function KeyInfoSection({
  vegetable,
  palette,
}: {
  vegetable: Vegetable;
  palette: ReturnType<typeof buildPalette>;
}) {
  const rows: { label: string; value: string }[] = [];
  if (vegetable.sunExposure)
    rows.push({
      label: "Nasłonecznienie",
      value: SUN_LABELS[vegetable.sunExposure] ?? vegetable.sunExposure,
    });
  if (vegetable.waterDemand)
    rows.push({
      label: "Zapotrzebowanie na wodę",
      value: DEMAND_LABELS[vegetable.waterDemand] ?? vegetable.waterDemand,
    });
  if (vegetable.nutrientDemand)
    rows.push({
      label: "Zapotrzebowanie na składniki",
      value:
        DEMAND_LABELS[vegetable.nutrientDemand] ?? vegetable.nutrientDemand,
    });
  if (vegetable.minSoilDepthCm != null)
    rows.push({
      label: "Min. głębokość gleby",
      value: `${vegetable.minSoilDepthCm} cm`,
    });
  if (vegetable.dominantNutrientDemand)
    rows.push({
      label: "Główny składnik",
      value:
        NUTRIENT_LABELS[vegetable.dominantNutrientDemand] ??
        vegetable.dominantNutrientDemand,
    });

  if (rows.length === 0) return null;
  return (
    <SectionCard title="Najważniejsze informacje" palette={palette}>
      <View style={s.infoGrid}>
        {rows.map((r) => (
          <View
            key={r.label}
            style={[
              s.infoGridItem,
              {
                backgroundColor: palette.innerCardBg,
                borderColor: palette.innerCardBorder,
              },
            ]}
          >
            <Text style={[s.infoLabel, { color: palette.meta }]}>
              {r.label}
            </Text>
            <Text style={[s.infoValue, { color: palette.heading }]}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
    </SectionCard>
  );
}

function SowingHarvestSection({
  vegetable,
  palette,
}: {
  vegetable: Vegetable;
  palette: ReturnType<typeof buildPalette>;
}) {
  const hasSowing =
    vegetable.sowingMethods && vegetable.sowingMethods.length > 0;
  const hasHarvest =
    vegetable.timeToHarvestDaysMin != null ||
    vegetable.timeToHarvestDaysMax != null ||
    vegetable.harvestStartMonth ||
    vegetable.harvestEndMonth ||
    vegetable.harvestSigns ||
    vegetable.successionSowing;

  if (!hasSowing && !hasHarvest) return null;

  return (
    <SectionCard title="Siew i zbiory" palette={palette}>
      {hasSowing ? (
        <View style={s.innerList}>
          {vegetable.sowingMethods!.map((method, i) => (
            <SowingMethodCard key={i} method={method} palette={palette} />
          ))}
        </View>
      ) : null}

      {hasHarvest ? (
        <View style={[s.innerList, hasSowing ? { marginTop: 16 } : {}]}>
          {vegetable.timeToHarvestDaysMin != null ||
          vegetable.timeToHarvestDaysMax != null ? (
            <InfoRow
              label="Czas do zbioru"
              value={`${vegetable.timeToHarvestDaysMin ?? "?"}–${vegetable.timeToHarvestDaysMax ?? "?"} dni`}
              palette={palette}
            />
          ) : null}
          {vegetable.harvestStartMonth || vegetable.harvestEndMonth ? (
            <InfoRow
              label="Okres zbioru"
              value={`${monthLabel(vegetable.harvestStartMonth) ?? "?"} – ${monthLabel(vegetable.harvestEndMonth) ?? "?"}`}
              palette={palette}
            />
          ) : null}
          <InfoRow
            label="Dosiew sukcesywny"
            value={vegetable.successionSowing ? "Tak" : "Nie"}
            palette={palette}
          />
          {vegetable.successionSowing && vegetable.successionIntervalDays ? (
            <InfoRow
              label="Częstotliwość dosiewu"
              value={`Co ${vegetable.successionIntervalDays} dni`}
              palette={palette}
            />
          ) : null}
          {vegetable.harvestSigns ? (
            <View
              style={[
                s.innerCard,
                {
                  backgroundColor: palette.innerCardBg,
                  borderColor: palette.innerCardBorder,
                  marginTop: 8,
                },
              ]}
            >
              <Text style={[s.innerCardTitle, { color: palette.accent }]}>
                Oznaki gotowości do zbioru
              </Text>
              <Text style={[s.innerCardDesc, { color: palette.secondary }]}>
                {vegetable.harvestSigns}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </SectionCard>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  scroll: {
    paddingBottom: 48,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  // hero image
  heroImageWrap: {
    width: "100%",
    height: 280,
  },
  heroImagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  // hero card
  heroCard: {
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  familyTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  familyTagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  vegetableName: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  latinName: {
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 2,
  },

  // badges
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  quickBadgeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // section cards
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  // description
  descText: {
    fontSize: 15,
    lineHeight: 25,
  },

  // info grid (2 cols)
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoGridItem: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },

  // info rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "400",
    flexShrink: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },

  // inner cards
  innerList: {
    gap: 12,
  },
  innerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  innerCardHeader: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  innerCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  innerCardMeta: {
    fontSize: 12,
    fontWeight: "400",
  },
  innerCardDesc: {
    fontSize: 14,
    lineHeight: 21,
  },

  // companions / pests
  companionGroup: {
    gap: 10,
  },
  companionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
    textTransform: "uppercase",
  },
  emptyNote: {
    fontSize: 14,
    fontStyle: "italic",
  },

  // metadata
  metaBlock: {
    marginHorizontal: 16,
    marginTop: 8,
    gap: 4,
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    fontWeight: "400",
  },
});
