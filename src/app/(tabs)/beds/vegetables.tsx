import { getResponseError } from "@/src/api/axios";
import { useCreateVegetableSuggestion } from "@/src/api/mutations/vegetableSuggestions/useCreateVegetableSuggestion";
import { VegetableListItem } from "@/src/api/queries/vegetables/types";
import { useGetVegetables } from "@/src/api/queries/vegetables/useGetVegetables";
import { setSelectedVegetable } from "@/src/app/(tabs)/beds/_state/vegetableSelectionStore";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  MD3Theme,
  Modal,
  Portal,
  useTheme,
} from "react-native-paper";

function buildPalette(dark: boolean) {
  return {
    background: dark ? "#141816" : "#F7F8F5",
    cardBg: dark ? "#1A1F1C" : "#FFFFFF",
    cardBorder: dark ? "#252D29" : "#E8ECE7",
    heading: dark ? "#F2F5F1" : "#1D2420",
    secondary: dark ? "#9AA59E" : "#6E7972",
    tertiary: dark ? "#7A8880" : "#97A29B",
    accent: dark ? "#7AB88A" : "#4A7C59",
    accentBg: dark ? "#1A2E1F" : "#EBF5EE",
    accentBorder: dark ? "#2A4A32" : "#C5DFC9",
    searchBg: dark ? "#1A211D" : "#F1F5F1",
    searchBorder: dark ? "#2C3530" : "#E1E8E2",
    searchPlaceholder: dark ? "#6F7A73" : "#9AA59E",
    imagePlaceholderBg: dark ? "#1F2823" : "#ECF4EE",
    imagePlaceholderIcon: dark ? "#8FB79A" : "#76A484",
    noticeBg: dark ? "#212A24" : "#EFF5F0",
    noticeBorder: dark ? "#2F3C34" : "#D8E6D9",
    noticeText: dark ? "#AFC7B6" : "#4F6A58",
    errorBg: dark ? "#2B1F20" : "#FCEFF1",
    errorBorder: dark ? "#4A3336" : "#F2D3D8",
    errorText: dark ? "#E5A7B2" : "#B44A5E",
    skeleton: dark ? "#2A332E" : "#E8EEE9",
  };
}

function VegetableRowSkeleton({
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
      <View style={[styles.rowImage, { backgroundColor: palette.skeleton }]} />
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

export default function VegetablePickerScreen() {
  const router = useRouter();
  const theme = useTheme<MD3Theme>();
  const palette = buildPalette(theme.dark);
  const isOffline = useIsOffline();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [suggestionVisible, setSuggestionVisible] = useState(false);
  const [suggestionName, setSuggestionName] = useState("");
  const [suggestionNote, setSuggestionNote] = useState("");
  const [suggestionSuccess, setSuggestionSuccess] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const createSuggestion = useCreateVegetableSuggestion();

  const openSuggestionModal = () => {
    setSuggestionName("");
    setSuggestionNote("");
    setSuggestionSuccess(false);
    setSuggestionError(null);
    setSuggestionVisible(true);
  };

  const closeSuggestionModal = () => {
    setSuggestionVisible(false);
  };

  const handleSendSuggestion = async () => {
    const trimmedName = suggestionName.trim();
    if (trimmedName.length < 2) {
      setSuggestionError("Nazwa musi mieć co najmniej 2 znaki.");
      return;
    }
    if (trimmedName.length > 80) {
      setSuggestionError("Nazwa może mieć maksymalnie 80 znaków.");
      return;
    }
    if (suggestionNote.trim().length > 500) {
      setSuggestionError("Notatka może mieć maksymalnie 500 znaków.");
      return;
    }
    setSuggestionError(null);
    try {
      await createSuggestion.mutateAsync({
        name: trimmedName,
        note: suggestionNote.trim() || null,
      });
      setSuggestionSuccess(true);
    } catch {
      setSuggestionError("Nie udało się wysłać propozycji. Spróbuj ponownie.");
    }
  };

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
  } = useGetVegetables({ q: searchQuery, limit: 20 });

  const vegetables = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );
  const initialLoading = isLoading && vegetables.length === 0;

  const renderItem = ({ item }: { item: VegetableListItem }) => (
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
        setSelectedVegetable({ id: item.id, name: item.name });
        router.back();
      }}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.rowImage}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.rowImage,
            { backgroundColor: palette.imagePlaceholderBg },
          ]}
        >
          <Icon
            source="sprout-outline"
            size={24}
            color={palette.imagePlaceholderIcon}
          />
        </View>
      )}

      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: palette.heading }]}>
          {item.name}
        </Text>
        {item.latinName ? (
          <Text
            style={[styles.rowLatin, { color: palette.secondary }]}
            numberOfLines={1}
          >
            {item.latinName}
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
      safeAreaEdges={["left", "right", "bottom"]}
    >
      <CustomHeader showBack />

      <FlatList
        data={vegetables}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: palette.heading }]}>
              Wybierz warzywo
            </Text>
            <View style={styles.subtitleRow}>
              <Text style={[styles.subtitle, { color: palette.secondary }]}>
                Wybierz roślinę, którą chcesz dodać do grządki.{" "}
              </Text>
              <Pressable onPress={openSuggestionModal}>
                <Text style={styles.suggestionLink}>Zgłoś propozycję</Text>
              </Pressable>
            </View>

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
                placeholder="Szukaj warzywa..."
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
                  <VegetableRowSkeleton
                    key={`skeleton-${idx}`}
                    palette={palette}
                  />
                ))
              : null}

            {error && vegetables.length === 0 && !initialLoading ? (
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
          ) : null
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          !initialLoading && !error ? (
            <View style={styles.emptyWrap}>
              <View
                style={[
                  styles.emptyIconWrap,
                  { backgroundColor: palette.imagePlaceholderBg },
                ]}
              >
                <Icon
                  source="sprout-outline"
                  size={26}
                  color={palette.imagePlaceholderIcon}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: palette.heading }]}>
                Nie znaleziono warzyw
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
      <Portal>
        <Modal
          visible={suggestionVisible}
          onDismiss={closeSuggestionModal}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: palette.cardBg },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {suggestionSuccess ? (
              <View style={styles.modalSuccessWrap}>
                <View
                  style={[
                    styles.modalSuccessIcon,
                    { backgroundColor: palette.accentBg },
                  ]}
                >
                  <Icon
                    source="check-circle-outline"
                    size={36}
                    color={palette.accent}
                  />
                </View>
                <Text
                  style={[styles.modalSuccessTitle, { color: palette.heading }]}
                >
                  Dziękujemy!
                </Text>
                <Text
                  style={[
                    styles.modalSuccessSubtitle,
                    { color: palette.secondary },
                  ]}
                >
                  Twoja propozycja została wysłana. Postaramy się dodać warzywo
                  jak najszybciej.
                </Text>
                <Button
                  mode="contained"
                  onPress={closeSuggestionModal}
                  style={styles.modalSuccessButton}
                >
                  Zamknij
                </Button>
              </View>
            ) : (
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: palette.heading }]}>
                    Zgłoś propozycję
                  </Text>
                  <Text
                    style={[styles.modalSubtitle, { color: palette.secondary }]}
                  >
                    Powiedz nam, jakiego warzywa brakuje na liście.
                  </Text>
                </View>

                <View
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: palette.searchBg,
                      borderColor:
                        suggestionError && suggestionName.trim().length === 0
                          ? palette.errorText
                          : palette.searchBorder,
                    },
                  ]}
                >
                  <TextInput
                    value={suggestionName}
                    onChangeText={(t) => {
                      setSuggestionName(t);
                      setSuggestionError(null);
                    }}
                    placeholder="Nazwa warzywa *"
                    placeholderTextColor={palette.searchPlaceholder}
                    style={[styles.modalInputText, { color: palette.heading }]}
                    maxLength={80}
                    autoFocus
                  />
                </View>

                <View
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: palette.searchBg,
                      borderColor: palette.searchBorder,
                      minHeight: 80,
                      alignItems: "flex-start",
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <TextInput
                    value={suggestionNote}
                    onChangeText={setSuggestionNote}
                    placeholder="Dodatkowe uwagi (opcjonalne)"
                    placeholderTextColor={palette.searchPlaceholder}
                    style={[styles.modalInputText, { color: palette.heading }]}
                    maxLength={500}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {suggestionError ? (
                  <Text
                    style={[
                      styles.modalErrorText,
                      { color: palette.errorText },
                    ]}
                  >
                    {suggestionError}
                  </Text>
                ) : null}

                <View style={styles.modalActions}>
                  <Button
                    mode="outlined"
                    onPress={closeSuggestionModal}
                    style={styles.modalActionButton}
                    disabled={createSuggestion.isPending}
                  >
                    Anuluj
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSendSuggestion}
                    style={styles.modalActionButton}
                    disabled={createSuggestion.isPending}
                  >
                    {createSuggestion.isPending ? (
                      <ActivityIndicator size={16} color="#fff" />
                    ) : (
                      "Wyślij"
                    )}
                  </Button>
                </View>
              </View>
            )}
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  headerContent: {
    gap: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: -6,
    gap: 0,
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
  rowImage: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  rowLatin: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
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
    height: 12,
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
  suggestionFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingBottom: 8,
    flexWrap: "wrap",
  },
  suggestionHint: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionLink: {
    fontSize: 14,
    lineHeight: 20,
    color: "#2563EB",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  modalContainer: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    gap: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 50,
    justifyContent: "center",
  },
  modalInputText: {
    fontSize: 15,
    flex: 1,
  },
  modalErrorText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -6,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalActionButton: {
    flex: 1,
  },
  modalSuccessWrap: {
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  modalSuccessIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalSuccessTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSuccessSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  modalSuccessButton: {
    marginTop: 8,
    width: "100%",
  },
});
