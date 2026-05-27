import { restClient } from "@/src/api/axios";
import { ManualActionTemplate } from "@/src/api/queries/actionTasks/types";
import {
  useCreateBedActionTask,
  useCreatePlantingActionTask,
} from "@/src/api/queries/actionTasks/useCreateManualActionTask";
import { useManualActionTemplates } from "@/src/api/queries/actionTasks/useManualActionTemplates";
import { useGetBeds } from "@/src/api/queries/beds/useGetBeds";
import { Planting } from "@/src/api/queries/plantings/types";
import { useGetPlantings } from "@/src/api/queries/plantings/useGetPlantings";
import { Vegetable } from "@/src/api/queries/vegetables/types";
import { vegetableKeys } from "@/src/api/queries/vegetables/vegetableKeys";
import { Screen } from "@/src/components/Screen";
import { BottomSheetModal } from "@/src/components/ui/BottomSheetModal";
import { getPlantingStatusLabel } from "@/src/features/plantings/status";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useQueries } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  Button,
  Icon,
  MD3Theme,
  Modal,
  Portal,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";

type TaskTargetType = "bed" | "planting";
type PlacePickerMode = "bed" | "planting";

type ValidationErrors = {
  target?: string;
  place?: string;
  template?: string;
  dueDate?: string;
};

const formatPolishDate = (date: Date) => {
  const isToday = new Date().toDateString() === new Date(date).toDateString();
  const formatted = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return isToday ? `Dzisiaj, ${formatted}` : formatted;
};

const toDefaultDueAtIso = (date: Date) => {
  const next = new Date(date);
  next.setHours(9, 0, 0, 0);
  return next.toISOString();
};

const getTemplatePriorityLabel = (value?: string | null) => {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return null;
  if (normalized.includes("HIGH")) return "Wysoki priorytet";
  if (normalized.includes("LOW")) return "Niski priorytet";
  if (normalized.includes("MEDIUM")) return "Średni priorytet";
  return null;
};

const truncate = (value?: string | null, max = 140) => {
  const text = value?.trim();
  if (!text) return null;
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
};

const getPlantingLabel = (planting: Planting) => {
  const vegetableName =
    planting.vegetableName?.trim() ||
    planting.vegetable?.name?.trim() ||
    planting.name?.trim() ||
    "Uprawa";

  if (planting.bedName?.trim()) {
    return `${vegetableName} • ${planting.bedName}`;
  }

  return vegetableName;
};

const getPlantingLabelWithVegetable = (
  planting: Planting,
  vegetableName?: string | null,
) => {
  const resolvedName =
    vegetableName?.trim() ||
    planting.vegetableName?.trim() ||
    planting.vegetable?.name?.trim() ||
    planting.name?.trim() ||
    `Uprawa #${planting.id.slice(0, 6)}`;

  if (planting.bedName?.trim()) {
    return `${resolvedName} • ${planting.bedName}`;
  }

  return resolvedName;
};

type PlantingPickerItemProps = {
  planting: Planting;
  vegetableName?: string | null;
  vegetableImageUrl?: string | null;
  isActive: boolean;
  onPress: () => void;
};

function PlantingPickerItem({
  planting,
  vegetableName,
  vegetableImageUrl,
  isActive,
  onPress,
}: PlantingPickerItemProps) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  const primaryLabel =
    vegetableName?.trim() ||
    planting.vegetableName?.trim() ||
    planting.vegetable?.name?.trim() ||
    planting.name?.trim() ||
    `Uprawa #${planting.id.slice(0, 6)}`;

  const secondaryLabel = planting.bedName?.trim()
    ? `Grządka: ${planting.bedName}`
    : "Wybrana uprawa";

  return (
    <Pressable
      style={[styles.sheetItem, isActive ? styles.sheetItemActive : null]}
      onPress={onPress}
    >
      <View style={styles.plantingSheetRow}>
        <View style={styles.plantingSheetThumbWrap}>
          {vegetableImageUrl ? (
            <Image
              source={{ uri: vegetableImageUrl }}
              style={styles.plantingSheetThumb}
            />
          ) : (
            <View style={styles.plantingSheetThumbFallback}>
              <Icon
                source="sprout-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          )}
        </View>

        <View style={styles.plantingSheetTextWrap}>
          <Text style={styles.sheetItemTitle}>{primaryLabel}</Text>
          <Text style={styles.sheetItemDescription}>{secondaryLabel}</Text>
        </View>

        <View style={styles.plantingStatusChip}>
          <Text style={styles.plantingStatusChipText}>
            {getPlantingStatusLabel(planting.status)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function PlannerCreateTaskScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{
    target?: string | string[];
    bedId?: string | string[];
    plantingId?: string | string[];
  }>();
  const isOffline = useIsOffline();

  const resolvedTargetParam = Array.isArray(params.target)
    ? params.target[0]
    : params.target;
  const resolvedBedIdParam = Array.isArray(params.bedId)
    ? params.bedId[0]
    : params.bedId;
  const resolvedPlantingIdParam = Array.isArray(params.plantingId)
    ? params.plantingId[0]
    : params.plantingId;

  const [targetType, setTargetType] = useState<TaskTargetType | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedPlantingId, setSelectedPlantingId] = useState<string | null>(
    null,
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [note, setNote] = useState("");
  const [templateQuery, setTemplateQuery] = useState("");

  const [showPlaceSheet, setShowPlaceSheet] = useState(false);
  const [placePickerMode, setPlacePickerMode] =
    useState<PlacePickerMode>("bed");
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [templateInfoItem, setTemplateInfoItem] =
    useState<ManualActionTemplate | null>(null);
  const lastAppliedPrefillRef = useRef<string | null>(null);

  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const bedsQuery = useGetBeds({ isActive: true, limit: 100 });
  const plantingsQuery = useGetPlantings(
    {
      limit: 100,
      bedId:
        targetType === "planting" ? (selectedBedId ?? undefined) : undefined,
    },
    { enabled: targetType === "planting" && Boolean(selectedBedId) },
  );
  const templatesQuery = useManualActionTemplates(targetType, templateQuery);

  const createBedTask = useCreateBedActionTask();
  const createPlantingTask = useCreatePlantingActionTask();

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const hasAnyPrefillParam =
      Boolean(resolvedTargetParam) ||
      Boolean(resolvedBedIdParam) ||
      Boolean(resolvedPlantingIdParam);

    if (!hasAnyPrefillParam) return;

    const prefillSignature = [
      resolvedTargetParam ?? "",
      resolvedBedIdParam ?? "",
      resolvedPlantingIdParam ?? "",
    ].join("|");

    if (lastAppliedPrefillRef.current === prefillSignature) return;

    if (resolvedTargetParam === "bed" || resolvedTargetParam === "planting") {
      setTargetType(resolvedTargetParam);
    } else if (resolvedPlantingIdParam) {
      setTargetType("planting");
    } else if (resolvedBedIdParam) {
      setTargetType("bed");
    }

    if (resolvedBedIdParam) {
      setSelectedBedId(resolvedBedIdParam);
    }

    if (resolvedPlantingIdParam) {
      setTargetType("planting");
      setSelectedPlantingId(resolvedPlantingIdParam);
    }

    lastAppliedPrefillRef.current = prefillSignature;
  }, [resolvedBedIdParam, resolvedPlantingIdParam, resolvedTargetParam]);

  const beds = useMemo(
    () => bedsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [bedsQuery.data?.pages],
  );

  const plantings = useMemo(
    () => plantingsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [plantingsQuery.data?.pages],
  );

  const plantingVegetableIds = useMemo(
    () =>
      Array.from(
        new Set(
          plantings
            .map((planting) => planting.vegetableId)
            .filter((value): value is string =>
              typeof value === "string" ? value.trim().length > 0 : false,
            ),
        ),
      ),
    [plantings],
  );

  const plantingVegetableQueries = useQueries({
    queries: plantingVegetableIds.map((vegetableId) => ({
      queryKey: vegetableKeys.detail(vegetableId),
      queryFn: async () => {
        const { data } = await restClient.get<Vegetable>(
          `/vegetables/${vegetableId}`,
        );
        return data;
      },
      enabled:
        (showPlaceSheet && placePickerMode === "planting") ||
        Boolean(selectedPlantingId),
      staleTime: 1000 * 60 * 10,
      retry: 0,
    })),
  });

  const vegetablesById = useMemo(() => {
    const map = new Map<string, Vegetable>();
    plantingVegetableQueries.forEach((query, index) => {
      const vegetable = query.data as Vegetable | undefined;
      const vegetableId = plantingVegetableIds[index];
      if (!vegetable || !vegetableId) return;
      map.set(vegetableId, vegetable);
    });
    return map;
  }, [plantingVegetableIds, plantingVegetableQueries]);

  useEffect(() => {
    if (!resolvedPlantingIdParam) return;
    const prefilledPlanting = plantings.find(
      (planting) => planting.id === resolvedPlantingIdParam,
    );
    if (!prefilledPlanting?.bedId) return;

    setSelectedBedId((previous) => previous ?? prefilledPlanting.bedId);
  }, [plantings, resolvedPlantingIdParam]);

  const selectedBed = useMemo(
    () => beds.find((bed) => bed.id === selectedBedId) ?? null,
    [beds, selectedBedId],
  );

  const selectedPlanting = useMemo(
    () =>
      plantings.find((planting) => planting.id === selectedPlantingId) ?? null,
    [plantings, selectedPlantingId],
  );

  const selectedPlantingLabel = useMemo(() => {
    if (!selectedPlanting) return null;
    const vegetableName = selectedPlanting.vegetableId
      ? vegetablesById.get(selectedPlanting.vegetableId)?.name
      : undefined;

    return getPlantingLabelWithVegetable(selectedPlanting, vegetableName);
  }, [selectedPlanting, vegetablesById]);

  const selectedTemplate = useMemo(
    () =>
      templatesQuery.data?.find(
        (template) => template.id === selectedTemplateId,
      ) ?? null,
    [selectedTemplateId, templatesQuery.data],
  );

  const isSubmitting = createBedTask.isPending || createPlantingTask.isPending;

  const isFormComplete =
    Boolean(targetType) &&
    Boolean(targetType === "bed" ? selectedBedId : selectedPlantingId) &&
    Boolean(selectedTemplateId) &&
    Boolean(dueDate);

  const clearTargetDependentValues = (nextTarget: TaskTargetType) => {
    setTargetType(nextTarget);
    setSelectedTemplateId(null);
    setTemplateQuery("");
    setErrors({});

    if (nextTarget === "bed") {
      setSelectedPlantingId(null);
      return;
    }
  };

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (!targetType) {
      nextErrors.target = "Wybierz, czego dotyczy zadanie.";
    }

    if (targetType === "bed" && !selectedBedId) {
      nextErrors.place = "Wybierz grządkę.";
    }

    if (targetType === "planting" && !selectedBedId) {
      nextErrors.place = "Wybierz grządkę.";
    }

    if (targetType === "planting" && selectedBedId && !selectedPlantingId) {
      nextErrors.place = "Wybierz uprawę.";
    }

    if (!selectedTemplateId) {
      nextErrors.template = "Wybierz zadanie.";
    }

    if (!dueDate) {
      nextErrors.dueDate = "Wybierz datę wykonania.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const getMutationErrorMessage = (error: unknown) => {
    const statusCandidate =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as any).response?.status === "number"
        ? (error as any).response.status
        : null;

    if (statusCandidate === 400) {
      return "Nie udało się dodać zadania. Sprawdź dane i spróbuj ponownie.";
    }

    if (statusCandidate === 403) {
      return "To zadanie nie jest dostępne do ręcznego dodania.";
    }

    if (statusCandidate === 404) {
      return "Nie znaleziono wybranej grządki, uprawy albo zadania.";
    }

    if (statusCandidate === 409) {
      return "Takie zadanie już istnieje.";
    }

    return "Nie udało się dodać zadania. Spróbuj ponownie.";
  };

  const handleSubmit = async () => {
    if (isOffline) {
      setSnackbarMessage("Połącz się z internetem, aby dodać zadanie.");
      return;
    }

    if (!validate() || !targetType || !selectedTemplateId || !dueDate) {
      return;
    }

    const payload = {
      actionTemplateId: selectedTemplateId,
      dueAt: toDefaultDueAtIso(dueDate),
      ...(note.trim() ? { description: note.trim() } : {}),
    };

    try {
      if (targetType === "bed" && selectedBedId) {
        await createBedTask.mutateAsync({
          bedId: selectedBedId,
          payload,
        });
      }

      if (targetType === "planting" && selectedPlantingId) {
        await createPlantingTask.mutateAsync({
          plantingId: selectedPlantingId,
          payload,
        });
      }

      setSnackbarMessage("Zadanie dodane");
      navigationTimeoutRef.current = setTimeout(() => {
        router.replace("/(tabs)/planner");
      }, 700);
    } catch (error) {
      setSnackbarMessage(getMutationErrorMessage(error));
    }
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerCard}>
            <View style={styles.headerIconWrap}>
              <Icon source="leaf" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Nowe zadanie</Text>
            <Text style={styles.subtitle}>
              Wybierz grządkę lub uprawę, rodzaj zadania i dzień wykonania.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Czego dotyczy zadanie?</Text>
            <View style={styles.targetGrid}>
              <Pressable
                style={[
                  styles.targetOption,
                  targetType === "bed" ? styles.targetOptionActive : null,
                ]}
                onPress={() => clearTargetDependentValues("bed")}
              >
                <Text
                  style={[
                    styles.targetOptionTitle,
                    targetType === "bed"
                      ? styles.targetOptionTitleActive
                      : null,
                  ]}
                >
                  Grządka
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.targetOption,
                  targetType === "planting" ? styles.targetOptionActive : null,
                ]}
                onPress={() => clearTargetDependentValues("planting")}
              >
                <Text
                  style={[
                    styles.targetOptionTitle,
                    targetType === "planting"
                      ? styles.targetOptionTitleActive
                      : null,
                  ]}
                >
                  Uprawa
                </Text>
              </Pressable>
            </View>
            {errors.target ? (
              <Text style={styles.errorText}>{errors.target}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Wybierz miejsce</Text>
            {!targetType ? (
              <Text style={styles.helperText}>
                Najpierw wybierz, czego dotyczy zadanie.
              </Text>
            ) : targetType === "bed" ? (
              <Pressable
                style={styles.selector}
                onPress={() => {
                  setPlacePickerMode("bed");
                  setShowPlaceSheet(true);
                }}
              >
                <View style={styles.selectorTextWrap}>
                  <Text style={styles.selectorLabel}>
                    {selectedBed?.name || "Wybierz grządkę"}
                  </Text>
                  <Text style={styles.selectorHint}>Wybór grządki</Text>
                </View>
                <Icon
                  source="chevron-right"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </Pressable>
            ) : (
              <View style={styles.selectorStack}>
                <Pressable
                  style={styles.selector}
                  onPress={() => {
                    setPlacePickerMode("bed");
                    setShowPlaceSheet(true);
                  }}
                >
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.selectorLabel}>
                      {selectedBed?.name || "Wybierz grządkę"}
                    </Text>
                    <Text style={styles.selectorHint}>
                      Najpierw wybierz grządkę
                    </Text>
                  </View>
                  <Icon
                    source="chevron-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>

                <Pressable
                  style={[
                    styles.selector,
                    !selectedBedId ? styles.selectorDisabled : null,
                  ]}
                  disabled={!selectedBedId}
                  onPress={() => {
                    setPlacePickerMode("planting");
                    setShowPlaceSheet(true);
                  }}
                >
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.selectorLabel}>
                      {selectedPlanting
                        ? (selectedPlantingLabel ??
                          getPlantingLabel(selectedPlanting))
                        : selectedBedId
                          ? "Wybierz uprawę"
                          : "Najpierw wybierz grządkę"}
                    </Text>
                    <Text style={styles.selectorHint}>
                      {selectedBedId
                        ? "Wybór konkretnej uprawy"
                        : "Lista upraw będzie dostępna po wyborze grządki"}
                    </Text>
                  </View>
                  <Icon
                    source="chevron-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </Pressable>
              </View>
            )}
            {errors.place ? (
              <Text style={styles.errorText}>{errors.place}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rodzaj zadania</Text>
            <Pressable
              style={styles.selector}
              onPress={() => setShowTemplateSheet(true)}
              disabled={!targetType}
            >
              <View style={styles.selectorTextWrap}>
                <Text style={styles.selectorLabel}>
                  {selectedTemplate?.name || "Wybierz zadanie"}
                </Text>
                <Text style={styles.selectorHint}>
                  {targetType
                    ? "Lista dostępnych zadań"
                    : "Najpierw wybierz grządkę lub uprawę"}
                </Text>
              </View>
              <Icon
                source="chevron-right"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
            {errors.template ? (
              <Text style={styles.errorText}>{errors.template}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Termin</Text>
            <Pressable
              style={styles.selector}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectorTextWrap}>
                <Text style={styles.selectorLabel}>
                  {dueDate
                    ? formatPolishDate(dueDate)
                    : "Wybierz datę wykonania"}
                </Text>
                <Text style={styles.selectorHint}>
                  Godzina zostanie ustawiona na 09:00
                </Text>
              </View>
              <Icon
                source="calendar-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
            {errors.dueDate ? (
              <Text style={styles.errorText}>{errors.dueDate}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Notatka</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Dodaj krótką notatkę, jeśli chcesz"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              style={styles.noteInput}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.submitButton,
              (!isFormComplete || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isFormComplete || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Dodaj zadanie</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <BottomSheetModal
        visible={showPlaceSheet}
        onDismiss={() => setShowPlaceSheet(false)}
      >
        <Text style={styles.sheetTitle}>
          {placePickerMode === "bed" ? "Wybierz grządkę" : "Wybierz uprawę"}
        </Text>

        {(placePickerMode === "bed" && bedsQuery.isLoading) ||
        (placePickerMode === "planting" && plantingsQuery.isLoading) ? (
          <ActivityIndicator style={styles.sheetLoader} />
        ) : null}

        {placePickerMode === "bed" ? (
          beds.length === 0 ? (
            <Text style={styles.sheetEmptyText}>Brak dostępnych grządek.</Text>
          ) : (
            beds.map((bed) => {
              const isActive = bed.id === selectedBedId;
              return (
                <Pressable
                  key={bed.id}
                  style={[
                    styles.sheetItem,
                    isActive ? styles.sheetItemActive : null,
                  ]}
                  onPress={() => {
                    setSelectedBedId(bed.id);
                    if (targetType === "planting") {
                      setSelectedPlantingId(null);
                    }
                    setShowPlaceSheet(false);
                    setErrors((prev) => ({ ...prev, place: undefined }));
                  }}
                >
                  <Text style={styles.sheetItemTitle}>{bed.name}</Text>
                </Pressable>
              );
            })
          )
        ) : placePickerMode === "planting" ? (
          !selectedBedId ? (
            <Text style={styles.sheetEmptyText}>Najpierw wybierz grządkę.</Text>
          ) : plantings.length === 0 ? (
            <Text style={styles.sheetEmptyText}>Brak dostępnych upraw.</Text>
          ) : (
            plantings.map((planting) => {
              const isActive = planting.id === selectedPlantingId;
              const matchedVegetable = planting.vegetableId
                ? vegetablesById.get(planting.vegetableId)
                : undefined;
              return (
                <PlantingPickerItem
                  key={planting.id}
                  planting={planting}
                  vegetableName={matchedVegetable?.name}
                  vegetableImageUrl={matchedVegetable?.imageUrl}
                  isActive={isActive}
                  onPress={() => {
                    setSelectedPlantingId(planting.id);
                    setShowPlaceSheet(false);
                    setErrors((prev) => ({ ...prev, place: undefined }));
                  }}
                />
              );
            })
          )
        ) : null}
      </BottomSheetModal>

      <BottomSheetModal
        visible={showTemplateSheet}
        onDismiss={() => setShowTemplateSheet(false)}
      >
        <Text style={styles.sheetTitle}>Wybierz zadanie</Text>
        <View style={styles.searchInputWrap}>
          <Icon
            source="magnify"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <TextInput
            value={templateQuery}
            onChangeText={setTemplateQuery}
            placeholder="Szukaj zadania"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={styles.searchInput}
          />
        </View>

        {!targetType ? (
          <Text style={styles.sheetEmptyText}>
            Najpierw wybierz, czego dotyczy zadanie.
          </Text>
        ) : templatesQuery.isLoading ? (
          <ActivityIndicator style={styles.sheetLoader} />
        ) : templatesQuery.data?.length ? (
          <ScrollView
            style={styles.sheetListScroll}
            contentContainerStyle={styles.sheetListContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {templatesQuery.data.map((template) => {
              const isSelected = template.id === selectedTemplateId;
              const priorityLabel = getTemplatePriorityLabel(template.priority);
              const shortDescription = truncate(template.description, 120);

              return (
                <View
                  key={template.id}
                  style={[
                    styles.templateCard,
                    isSelected ? styles.sheetItemActive : null,
                  ]}
                >
                  <View style={styles.templateCardHeader}>
                    <Text style={styles.sheetItemTitle}>{template.name}</Text>
                    <Pressable
                      onPress={() => setTemplateInfoItem(template)}
                      style={styles.templateInfoButton}
                      hitSlop={8}
                    >
                      <Icon
                        source="information-outline"
                        size={18}
                        color={theme.colors.onSurfaceVariant}
                      />
                    </Pressable>
                  </View>

                  {shortDescription ? (
                    <Text style={styles.sheetItemDescription}>
                      {shortDescription}
                    </Text>
                  ) : null}

                  <View style={styles.templateCardFooter}>
                    {priorityLabel ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{priorityLabel}</Text>
                      </View>
                    ) : (
                      <View />
                    )}

                    <Button
                      mode="contained"
                      buttonColor="#2F6B4F"
                      textColor="#FFFFFF"
                      style={styles.templateSelectButton}
                      onPress={() => {
                        setSelectedTemplateId(template.id);
                        setShowTemplateSheet(false);
                        setErrors((prev) => ({ ...prev, template: undefined }));
                      }}
                    >
                      Wybierz
                    </Button>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.sheetEmptyText}>
            Brak dostępnych zadań dla tego typu.
          </Text>
        )}
      </BottomSheetModal>

      <Portal>
        <Modal
          visible={Boolean(templateInfoItem)}
          onDismiss={() => setTemplateInfoItem(null)}
          contentContainerStyle={styles.infoModal}
        >
          <Text style={styles.modalTitle}>{templateInfoItem?.name}</Text>
          <Text style={styles.infoModalText}>
            {templateInfoItem?.description?.trim() ||
              "Brak dodatkowego opisu dla tego zadania."}
          </Text>
          <Button mode="contained" onPress={() => setTemplateInfoItem(null)}>
            Zamknij
          </Button>
        </Modal>
      </Portal>

      <DatePickerModal
        locale="pl"
        mode="single"
        visible={showDatePicker}
        date={dueDate ?? new Date()}
        onDismiss={() => setShowDatePicker(false)}
        onConfirm={({ date }) => {
          setShowDatePicker(false);
          if (!date) return;
          setDueDate(date);
          setErrors((prev) => ({ ...prev, dueDate: undefined }));
        }}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={2600}
      >
        {snackbarMessage}
      </Snackbar>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: "#F5F7F4",
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 120,
      gap: 20,
    },
    headerCard: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 10,
    },
    headerIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ECF4EE",
    },
    title: {
      fontSize: 30,
      fontWeight: "700",
      color: "#1D2420",
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 23,
      color: "#66756B",
    },
    card: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: "#1D2420",
    },
    helperText: {
      fontSize: 14,
      color: "#7A867E",
      lineHeight: 21,
    },
    targetGrid: {
      flexDirection: "row",
      gap: 12,
    },
    targetOption: {
      flex: 1,
      minHeight: 54,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F4F7F3",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 10,
    },
    targetOptionActive: {
      borderColor: "#BFD9C6",
      backgroundColor: "#ECF5EE",
    },
    targetOptionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#35443A",
    },
    targetOptionTitleActive: {
      color: "#2F6B4F",
    },
    selector: {
      minHeight: 56,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F4F7F3",
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    selectorStack: {
      gap: 10,
    },
    selectorDisabled: {
      opacity: 0.55,
    },
    selectorTextWrap: {
      flex: 1,
      gap: 2,
    },
    selectorLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: "#233129",
    },
    selectorHint: {
      fontSize: 13,
      color: "#78857D",
    },
    noteInput: {
      minHeight: 128,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F4F7F3",
      paddingHorizontal: 14,
      paddingVertical: 14,
      fontSize: 15,
      color: "#233129",
    },
    errorText: {
      fontSize: 13,
      color: theme.colors.error,
    },
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 16,
      backgroundColor: "rgba(245, 247, 244, 0.98)",
      borderTopWidth: 1,
      borderTopColor: "#E5EBE3",
    },
    submitButton: {
      height: 54,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    submitButtonDisabled: {
      opacity: 0.55,
    },
    submitButtonText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    sheetTitle: {
      fontSize: 21,
      fontWeight: "700",
      color: theme.colors.onSurface,
      marginBottom: 6,
    },
    sheetLoader: {
      marginVertical: 20,
    },
    sheetEmptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginVertical: 8,
    },
    sheetItem: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F8FAF7",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 8,
      marginBottom: 10,
    },
    sheetListScroll: {
      maxHeight: 420,
    },
    sheetListContent: {
      paddingBottom: 8,
    },
    templateCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F8FAF7",
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 8,
      marginBottom: 10,
    },
    templateCardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    templateInfoButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#EEF3EE",
      borderWidth: 1,
      borderColor: "#DFE8E0",
    },
    templateCardFooter: {
      flexDirection: "column",
      alignItems: "stretch",
      justifyContent: "flex-start",
      gap: 8,
      marginTop: 2,
    },
    templateSelectButton: {
      width: "100%",
      borderRadius: 14,
    },
    plantingSheetRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    plantingSheetThumbWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#EEF3EE",
    },
    plantingSheetThumb: {
      width: "100%",
      height: "100%",
    },
    plantingSheetThumbFallback: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    plantingSheetTextWrap: {
      flex: 1,
      gap: 2,
    },
    plantingStatusChip: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: "#EAF3EC",
      borderWidth: 1,
      borderColor: "#DCE8DE",
    },
    plantingStatusChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#4A6654",
    },
    sheetItemActive: {
      borderColor: "#BFD9C6",
      backgroundColor: "#ECF5EE",
    },
    sheetItemTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: "#233129",
    },
    sheetItemDescription: {
      fontSize: 14,
      color: "#6B786F",
      lineHeight: 21,
    },
    chip: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: "#EAF3EC",
    },
    chipText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#436A52",
    },
    searchInputWrap: {
      minHeight: 54,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      backgroundColor: "#F4F7F3",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 14,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: "#233129",
      paddingVertical: 0,
    },
    infoModal: {
      backgroundColor: "#FFFFFF",
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: "#E5EBE3",
      padding: 18,
      gap: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#1D2420",
    },
    infoModalText: {
      fontSize: 14,
      lineHeight: 21,
      color: "#5D6A61",
    },
  });
