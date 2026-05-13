import { getResponseError } from "@/src/api/axios";
import { Soil } from "@/src/api/queries/soils/types";
import { useGetSoils } from "@/src/api/queries/soils/useGetSoils";
import { setSelectedSoil } from "@/src/app/(tabs)/beds/_state/soilSelectionStore";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Icon, MD3Theme, useTheme } from "react-native-paper";

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    accent: dark ? "#7AB88A" : "#4A7C59",
    iconBg: dark ? "#1F2823" : "#ECF4EE",
    iconColor: dark ? "#8FB79A" : "#76A484",
    searchBg: dark ? "#1A211D" : "#F1F5F1",
    searchBorder: dark ? "#2C3530" : "#E1E8E2",
    searchPlaceholder: dark ? "#6F7A73" : "#9AA59E",
    noticeBg: dark ? "#212A24" : "#EFF5F0",
    noticeBorder: dark ? "#2F3C34" : "#D8E6D9",
    noticeText: dark ? "#AFC7B6" : "#4F6A58",
    errorBg: dark ? "#2B1F20" : "#FCEFF1",
    errorBorder: dark ? "#4A3336" : "#F2D3D8",
    errorText: dark ? "#E5A7B2" : "#B44A5E",
    skeleton: dark ? "#2A332E" : "#E8EEE9",
  };
}

function SoilRowSkeleton({
  palette,
}: {
  palette: ReturnType<typeof buildPalette>;
}) {
  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      <View
        style={[styles.rowIconWrap, { backgroundColor: palette.skeleton }]}
      />
      <View style={styles.rowBody}>
        <View
          style={[
            styles.skeletonLineMain,
            { backgroundColor: palette.skeleton },
          ]}
        />
        <View
          style={[
            styles.skeletonLineSub,
            { backgroundColor: palette.skeleton },
          ]}
        />
      </View>
    </View>
  );
}

export default function SoilPickerScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const isOffline = useIsOffline();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetSoils({ q: searchQuery, limit: 20 });

  const soils = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );
  const initialLoading = isLoading && soils.length === 0;

  const renderItem = ({ item }: { item: Soil }) => (
    <Pressable
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      onPress={() => {
        setSelectedSoil({ id: item.id, name: item.name });
        router.back();
      }}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: palette.iconBg }]}>
        <Icon source="shovel" size={22} color={palette.iconColor} />
      </View>

      <View style={styles.rowBody}>
        <Text
          style={[styles.rowTitle, { color: palette.heading }]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.description ? (
          <Text
            style={[styles.rowSubtitle, { color: palette.secondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}
      </View>

      <View style={styles.rowActionWrap}>
        <Text style={[styles.rowActionText, { color: palette.accent }]}>
          Wybierz
        </Text>
        <Icon source="chevron-right" size={20} color={palette.accent} />
      </View>
    </Pressable>
  );

  return (
    <Screen
      style={{ backgroundColor: palette.background }}
      safeAreaEdges={["left", "right"]}
    >
      <CustomHeader showBack title="Wybierz rodzaj gleby" />

      <FlatList
        data={soils}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={[styles.subtitle, { color: palette.secondary }]}>
              Dopasuj glebę do grządki, aby ułatwić planowanie upraw.
            </Text>

            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: palette.searchBg,
                  borderColor: palette.searchBorder,
                },
              ]}
            >
              <Icon
                source="magnify"
                size={21}
                color={palette.searchPlaceholder}
              />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Szukaj rodzaju gleby..."
                placeholderTextColor={palette.searchPlaceholder}
                style={[styles.searchInput, { color: palette.heading }]}
              />
            </View>

            {isOffline ? (
              <View
                style={[
                  styles.offlineNotice,
                  {
                    backgroundColor: palette.noticeBg,
                    borderColor: palette.noticeBorder,
                  },
                ]}
              >
                <Icon
                  source="wifi-strength-off-outline"
                  size={16}
                  color={palette.noticeText}
                />
                <Text
                  style={[
                    styles.offlineNoticeText,
                    { color: palette.noticeText },
                  ]}
                >
                  {OFFLINE_MUTATION_MESSAGE}
                </Text>
              </View>
            ) : null}

            {initialLoading
              ? [0, 1, 2, 3, 4].map((idx) => (
                  <SoilRowSkeleton key={`skeleton-${idx}`} palette={palette} />
                ))
              : null}

            {error && soils.length === 0 && !initialLoading ? (
              <View
                style={[
                  styles.errorCard,
                  {
                    backgroundColor: palette.errorBg,
                    borderColor: palette.errorBorder,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: palette.errorText }]}>
                  {String(getResponseError(error))}
                </Text>
                <Button mode="outlined" onPress={() => refetch()}>
                  Spróbuj ponownie
                </Button>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          !initialLoading && hasNextPage ? (
            <Button
              mode="outlined"
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={styles.loadMoreButton}
            >
              {isFetchingNextPage ? "Ładowanie..." : "Wczytaj więcej"}
            </Button>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          !initialLoading && !error ? (
            <View style={styles.emptyWrap}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: palette.iconBg },
                ]}
              >
                <Icon source="shovel" size={24} color={palette.iconColor} />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.heading }]}>
                Nie znaleziono rodzajów gleby
              </Text>
              <Text
                style={[styles.emptySubtitle, { color: palette.secondary }]}
              >
                Spróbuj zmienić frazę wyszukiwania.
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 0,
    gap: 12,
  },
  headerContent: {
    gap: 14,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  searchBar: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  offlineNotice: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offlineNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  rowCard: {
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 2,
  },
  rowIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowActionWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  rowActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  loadMoreButton: {
    marginTop: 10,
    marginBottom: 4,
  },
  footerSpace: {
    height: 0,
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 2,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyWrap: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  skeletonLineMain: {
    width: "75%",
    height: 14,
    borderRadius: 999,
  },
  skeletonLineSub: {
    width: "55%",
    height: 11,
    borderRadius: 999,
  },
});
