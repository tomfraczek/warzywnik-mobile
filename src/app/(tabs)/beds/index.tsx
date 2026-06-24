import { useGetBedActionTasks } from "@/src/api/queries/actionTasks/useGetBedActionTasks";
import { Bed, CultivationEnvironment } from "@/src/api/queries/beds/types";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { usePremium } from "@/src/context/PremiumContext";
import { PrimaryScreenHeading } from "@/src/components/navigation/PrimaryScreenHeading";
import { Screen } from "@/src/components/Screen";
import { CoachMarkOverlay } from "@/src/components/tutorial/CoachMarkOverlay";
import { useSettings } from "@/src/context/SettingsProvider";
import { isPlantingActiveLifecycleStatus } from "@/src/features/plantings/status";
import { pluralize } from "@/src/utils/pluralize";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import {
  FlatList,
  Pressable,
  TextInput as RNTextInput,
  StyleSheet,
  View,
} from "react-native";
import { Icon, MD3Theme, Text, useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useDebouncedValue } from "../education/_components/useDebouncedValue";

// ─── palette ─────────────────────────────────────────────────────────────────

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    searchBg: dark ? "#1D221F" : "#EDEFEC",
    searchBorder: dark ? "#252D29" : "#E2E7E1",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    meta: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    activeBadgeBg: dark ? "#1A2E1F" : "#E6F4E9",
    activeBadgeText: dark ? "#7AB88A" : "#2E6B3E",
    inactiveBadgeBg: dark ? "#2A2E2B" : "#F1F1F0",
    inactiveBadgeText: dark ? "#7A8880" : "#7A7E7B",
    envBg: dark ? "#222B26" : "#F0F5F0",
    soilBg: dark ? "#1E2822" : "#F0F5F0",
    chipBg: dark ? "#1F2722" : "#F3F6F2",
    innerBg: dark ? "#161C19" : "#F3F5F2",
    filterActiveBg: dark ? "#1A2E1F" : "#EBF5EE",
    filterActiveBorder: dark ? "#2A4A32" : "#C5DFC9",
    filterActiveText: dark ? "#7AB88A" : "#2E6B3E",
    filterBg: dark ? "#1D221F" : "#F0F2EF",
    filterBorder: dark ? "#252D29" : "#E2E7E1",
    filterText: dark ? "#9AA59E" : "#6E7972",
    searchIcon: dark ? "#6A7870" : "#9AA49D",
    placeholder: dark ? "#5A6660" : "#A8B4AE",
  };
}

// ─── label maps ──────────────────────────────────────────────────────────────

const ENV_LABELS: Record<CultivationEnvironment, string> = {
  GROUND_OUTDOOR: "W gruncie",
  RAISED_BED_OUTDOOR: "Podwyższona grządka",
  POT_OUTDOOR: "Donica na zewnątrz",
  POT_INDOOR: "Donica w domu",
  GREENHOUSE: "Szklarnia",
  TUNNEL: "Tunel",
};

const ENV_ICONS: Record<CultivationEnvironment, string> = {
  GROUND_OUTDOOR: "sprout-outline",
  RAISED_BED_OUTDOOR: "rectangle-outline",
  POT_OUTDOOR: "flower-outline",
  POT_INDOOR: "home-outline",
  GREENHOUSE: "greenhouse",
  TUNNEL: "tunnel-outline",
};

// ─── shimmer ─────────────────────────────────────────────────────────────────

function useShimmer() {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withTiming(0.3, { duration: 900, easing: Easing.inOut(Easing.ease) }),
    -1,
    true,
  );
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function BedCardSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  const shimmer = useShimmer();
  const block = (w: string | number, h: number, r = 8) => (
    <Animated.View
      style={[
        {
          width: w as any,
          height: h,
          borderRadius: r,
          backgroundColor: palette.innerBg,
        },
        shimmer,
      ]}
    />
  );
  return (
    <View
      style={[
        s.card,
        { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        {block("55%", 22)}
        {block(60, 22, 999)}
      </View>
      {block("40%", 14)}
      <View style={{ height: 12 }} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        {block(80, 26, 999)}
        {block(100, 26, 999)}
      </View>
    </View>
  );
}

// ─── bed card ─────────────────────────────────────────────────────────────────

function BedCard({
  bed,
  activePlantings,
  palette,
  onPress,
  wrapperRef,
}: {
  bed: Bed;
  activePlantings: number;
  palette: ReturnType<typeof buildPalette>;
  onPress: () => void;
  wrapperRef?: RefObject<View | null>;
}) {
  const isLocked = bed.accessStatus === "locked";
  const env = bed.cultivationEnvironment;
  const { data: pendingTasksData } = useGetBedActionTasks(
    bed.id,
    "pending",
    undefined,
    "includingChildren",
  );
  const relevantPendingTasks = (pendingTasksData?.items ?? []).filter(
    (task) => !task.suppressedAt,
  );
  const hasPendingTasks = relevantPendingTasks.length > 0;
  const soilName = bed.soil?.name ?? null;
  const hasDimensions = bed.depthCm != null;
  const hasMeasurements =
    bed.soilTestingEnabled &&
    (bed.measuredN != null ||
      bed.measuredP != null ||
      bed.measuredK != null ||
      bed.measuredPh != null);

  const dimensionLabel = bed.depthCm != null ? `${bed.depthCm} cm` : null;

  const measurementLabel = [
    bed.measuredN != null ? `N ${bed.measuredN}` : null,
    bed.measuredP != null ? `P ${bed.measuredP}` : null,
    bed.measuredK != null ? `K ${bed.measuredK}` : null,
    bed.measuredPh != null ? `pH ${bed.measuredPh}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View ref={wrapperRef} collapsable={false}>
      <Pressable
        onPress={onPress}
        style={[
          s.card,
          { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
          isLocked ? s.cardLocked : null,
        ]}
      >
      {/* top row: name + status */}
      <View style={s.cardTopRow}>
        <View style={s.bedNameWrap}>
          {isLocked ? (
            <Icon source="lock-outline" size={16} color={palette.secondary} />
          ) : null}
          <Text
            style={[s.bedName, { color: isLocked ? palette.secondary : palette.heading }]}
            numberOfLines={1}
          >
            {bed.name}
          </Text>
          {!isLocked && hasPendingTasks ? (
            <Icon source="alert" size={16} color="#B6473D" />
          ) : null}
        </View>
        {isLocked ? (
          <View style={[s.statusBadge, { backgroundColor: palette.inactiveBadgeBg }]}>
            <Text style={[s.statusBadgeText, { color: palette.inactiveBadgeText }]}>
              Premium
            </Text>
          </View>
        ) : (
          <View
            style={[
              s.statusBadge,
              {
                backgroundColor:
                  bed.isActive !== true
                    ? palette.inactiveBadgeBg
                    : palette.activeBadgeBg,
              },
            ]}
          >
            <Text
              style={[
                s.statusBadgeText,
                {
                  color:
                    bed.isActive !== true
                      ? palette.inactiveBadgeText
                      : palette.activeBadgeText,
                },
              ]}
            >
              {bed.isActive !== true ? "Nieaktywna" : "Aktywna"}
            </Text>
          </View>
        )}
      </View>

      {/* location / description */}
      {bed.locationLabel || bed.description ? (
        <Text
          style={[s.cardLocation, { color: palette.secondary }]}
          numberOfLines={2}
        >
          {bed.locationLabel || bed.description}
        </Text>
      ) : null}

      {/* depth */}
      {hasDimensions ? (
        <Text style={[s.cardDims, { color: palette.meta }]}>
          Głębokość: {dimensionLabel}
        </Text>
      ) : null}

      {/* chips row */}
      <View style={s.chipsRow}>
        {env ? (
          <View style={[s.chip, { backgroundColor: palette.envBg }]}>
            <Icon source={ENV_ICONS[env]} size={13} color={palette.accent} />
            <Text style={[s.chipText, { color: palette.accent }]}>
              {ENV_LABELS[env]}
            </Text>
          </View>
        ) : null}

        {soilName ? (
          <View style={[s.chip, { backgroundColor: palette.soilBg }]}>
            <Icon source="layers-outline" size={13} color={palette.secondary} />
            <Text style={[s.chipText, { color: palette.secondary }]}>
              {soilName}
            </Text>
          </View>
        ) : null}

        {activePlantings > 0 ? (
          <View style={[s.chip, { backgroundColor: palette.chipBg }]}>
            <Icon source="sprout-outline" size={13} color={palette.meta} />
            <Text style={[s.chipText, { color: palette.meta }]}>
              {activePlantings}{" "}
              {pluralize("uprawa", "uprawy", "upraw", activePlantings)}
            </Text>
          </View>
        ) : null}
      </View>

      {/* soil measurements */}
      {hasMeasurements ? (
        <Text style={[s.cardMeasurements, { color: palette.meta }]}>
          Analiza: {measurementLabel}
        </Text>
      ) : null}

      {/* locked data info */}
      {isLocked ? (
        <Text style={[s.lockedInfo, { color: palette.secondary }]}>
          Te dane nadal są zapisane na Twoim koncie. Odblokujesz je po aktywacji Premium.
        </Text>
      ) : null}

      {/* chevron hint */}
        <View style={s.chevronRow}>
          <Icon source="chevron-right" size={18} color={palette.cardBorder} />
        </View>
      </Pressable>
    </View>
  );
}

// ─── filter chips ─────────────────────────────────────────────────────────────

type ActiveFilter = "all" | "active" | "inactive";

function FilterChips({
  value,
  onChange,
  palette,
}: {
  value: ActiveFilter;
  onChange: (v: ActiveFilter) => void;
  palette: ReturnType<typeof buildPalette>;
}) {
  const options: { key: ActiveFilter; label: string }[] = [
    { key: "all", label: "Wszystkie" },
    { key: "active", label: "Aktywne" },
    { key: "inactive", label: "Nieaktywne" },
  ];
  return (
    <View style={s.filterRow}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[
              s.filterChip,
              {
                backgroundColor: active
                  ? palette.filterActiveBg
                  : palette.filterBg,
                borderColor: active
                  ? palette.filterActiveBorder
                  : palette.filterBorder,
              },
            ]}
          >
            <Text
              style={[
                s.filterChipText,
                {
                  color: active ? palette.filterActiveText : palette.filterText,
                  fontWeight: active ? "600" : "400",
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  palette,
  onAdd,
  wrapperRef,
}: {
  palette: ReturnType<typeof buildPalette>;
  onAdd: () => void;
  wrapperRef?: RefObject<View | null>;
}) {
  return (
    <View ref={wrapperRef} collapsable={false} style={s.emptyWrap}>
      <View style={[s.emptyIconWrap, { backgroundColor: palette.accentBg }]}>
        <Icon source="sprout-outline" size={36} color={palette.accent} />
      </View>
      <Text style={[s.emptyTitle, { color: palette.heading }]}>
        Nie masz jeszcze grządek
      </Text>
      <Text style={[s.emptyDesc, { color: palette.secondary }]}>
        Dodaj pierwszą grządkę, aby zacząć planować uprawę.
      </Text>
      <Pressable
        style={[s.emptyBtn, { backgroundColor: palette.accent }]}
        onPress={onAdd}
      >
        <Text style={s.emptyBtnText}>Dodaj grządkę</Text>
      </Pressable>
    </View>
  );
}

// ─── screen ──────────────────────────────────────────────────────────────────

export default function BedsListScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const { openPremiumPaywall, entitlements } = usePremium();

  const [searchInput, setSearchInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const debouncedSearch = useDebouncedValue(searchInput, 350);

  const { tutorials, setTutorials } = useSettings();
  const [showTutorial, setShowTutorial] = useState(false);
  const addBtnRef = useRef<View | null>(null);
  const filterChipsRef = useRef<View | null>(null);
  const firstBedCardRef = useRef<View | null>(null);
  const emptyStateRef = useRef<View | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (tutorials.enabled && !tutorials.bedsSeen) {
        setShowTutorial(true);
      }
    }, [tutorials.enabled, tutorials.bedsSeen]),
  );

  const handleTutorialDismiss = useCallback(
    (dontShowAgain: boolean) => {
      setShowTutorial(false);
      if (dontShowAgain) {
        setTutorials({ bedsSeen: true });
      }
    },
    [setTutorials],
  );

  const isActiveParam =
    activeFilter === "active"
      ? true
      : activeFilter === "inactive"
        ? false
        : undefined;

  const bedsQuery = useGetBeds({
    q: debouncedSearch || undefined,
    isActive: isActiveParam,
    limit: 50,
  });

  const plantingsQuery = useGetPlantings({ limit: 100 });

  const beds = useMemo(
    () => bedsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bedsQuery.data?.pages],
  );

  const visibleBeds = useMemo(() => {
    if (activeFilter === "active") {
      return beds.filter((bed) => bed.isActive === true);
    }
    if (activeFilter === "inactive") {
      return beds.filter((bed) => bed.isActive !== true);
    }
    return beds;
  }, [beds, activeFilter]);

  const total = visibleBeds.length;

  const activePlantingsCountByBed = useMemo(() => {
    const counts = new Map<string, number>();
    const items =
      plantingsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    items.forEach((item) => {
      if (!item.bedId) return;
      if (!isPlantingActiveLifecycleStatus(item.status)) return;
      counts.set(item.bedId, (counts.get(item.bedId) ?? 0) + 1);
    });
    return counts;
  }, [plantingsQuery.data?.pages]);

  const isLoading = bedsQuery.isLoading && visibleBeds.length === 0;

  const tutorialSteps = useMemo(
    () => [
      {
        ref: addBtnRef,
        title: "Dodaj grządkę",
        description:
          "Tutaj tworzysz nową grządkę — możesz podać jej nazwę, środowisko uprawy i inne szczegóły.",
        placement: "bottom" as const,
      },
      {
        ref: filterChipsRef,
        title: "Filtruj grządki",
        description:
          "Przełączaj między wszystkimi, aktywnymi i nieaktywnymi grządkami, aby szybko znaleźć to, czego szukasz.",
        placement: "bottom" as const,
      },
      beds.length > 0
        ? {
            ref: firstBedCardRef,
            title: "Karta grządki",
            description:
              "Dotknij kartę, aby zobaczyć szczegóły, uprawy i zadania przypisane do tej grządki.",
            placement: "bottom" as const,
          }
        : {
            ref: emptyStateRef,
            title: "Tu pojawią się Twoje grządki",
            description:
              "Każda dodana grządka będzie widoczna tutaj jako karta. Dotknij kartę, aby zarządzać uprawami i zadaniami.",
            placement: "top" as const,
          },
    ],
    // refs are stable — only beds.length determines which variant of step 3 to use
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beds.length],
  );

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["top", "left", "right"]}
    >
      <FlatList
        data={isLoading ? [] : visibleBeds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          s.content,
          { backgroundColor: palette.background },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <PrimaryScreenHeading
              title="Grządki"
              subtitle="Zarządzaj swoimi grządkami i warunkami uprawy."
            />

            {/* search */}
            <View
              style={[
                s.searchBar,
                {
                  backgroundColor: palette.searchBg,
                  borderColor: palette.searchBorder,
                },
              ]}
            >
              <Icon source="magnify" size={20} color={palette.searchIcon} />
              <RNTextInput
                style={[s.searchInput, { color: palette.heading }]}
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Szukaj grządki…"
                placeholderTextColor={palette.placeholder}
                returnKeyType="search"
              />
              {searchInput.length > 0 ? (
                <Pressable onPress={() => setSearchInput("")} hitSlop={8}>
                  <Icon source="close-circle" size={18} color={palette.meta} />
                </Pressable>
              ) : null}
            </View>

            {/* count + filter */}
            <View style={s.listMeta}>
              <View>
                <Text style={[s.listTitle, { color: palette.heading }]}>
                  Twoje grządki
                </Text>
                {total != null ? (
                  <Text style={[s.listCount, { color: palette.meta }]}>
                    {total}{" "}
                    {total === 1
                      ? "grządka"
                      : total < 5
                        ? "grządki"
                        : "grządek"}
                  </Text>
                ) : null}
              </View>
              <View ref={addBtnRef} collapsable={false}>
                <Pressable
                  style={[
                    s.addBtn,
                    {
                      backgroundColor: palette.accentBg,
                      borderColor: palette.accentBorder,
                    },
                  ]}
                  onPress={() => {
                    const bedLimit = entitlements?.limits.beds;
                    if (bedLimit !== null && bedLimit !== undefined && beds.length >= bedLimit) {
                      openPremiumPaywall({ reason: "bedsLimit" });
                      return;
                    }
                    router.push("/(tabs)/beds/new");
                  }}
                >
                  <Icon source="plus" size={16} color={palette.accent} />
                  <Text style={[s.addBtnText, { color: palette.accent }]}>
                    Dodaj
                  </Text>
                </Pressable>
              </View>
            </View>

            <View ref={filterChipsRef} collapsable={false} style={s.filterChipsWrapper}>
              <FilterChips
                value={activeFilter}
                onChange={setActiveFilter}
                palette={palette}
              />
            </View>

            {/* skeleton loading */}
            {isLoading ? (
              <View style={{ gap: 14, marginTop: 4 }}>
                {[1, 2, 3].map((i) => (
                  <BedCardSkeleton key={i} palette={palette} />
                ))}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <BedCard
            bed={item}
            activePlantings={activePlantingsCountByBed.get(item.id) ?? 0}
            palette={palette}
            onPress={() => {
              if (item.accessStatus === "locked") {
                openPremiumPaywall({ reason: "lockedBed" });
                return;
              }
              router.push(`/(tabs)/beds/${item.id}`);
            }}
            wrapperRef={index === 0 ? firstBedCardRef : undefined}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              palette={palette}
              onAdd={() => {
                const bedLimit = entitlements?.limits.beds;
                if (bedLimit !== null && bedLimit !== undefined && beds.length >= bedLimit) {
                  openPremiumPaywall({ reason: "bedsLimit" });
                  return;
                }
                router.push("/(tabs)/beds/new");
              }}
              wrapperRef={emptyStateRef}
            />
          ) : null
        }
      />

      <CoachMarkOverlay
        visible={showTutorial}
        onDismiss={handleTutorialDismiss}
        steps={tutorialSteps}
      />
    </Screen>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 0,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  listMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  listCount: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  filterChipsWrapper: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  // card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  cardLocked: {
    opacity: 0.6,
  },
  lockedInfo: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bedNameWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bedName: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardLocation: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardDims: {
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardMeasurements: {
    fontSize: 12,
    lineHeight: 18,
  },
  chevronRow: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: -4,
  },
  // empty state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 52,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
