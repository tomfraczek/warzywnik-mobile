import { getResponseError } from "@/src/api/axios";
import {
  PlanChecklistItem,
  PlanChecklistStatus,
} from "@/src/api/queries/bedPlan/types";
import { useCreatePlanChecklistItem } from "@/src/api/queries/bedPlan/useCreatePlanChecklistItem";
import { useDeletePlanChecklistItem } from "@/src/api/queries/bedPlan/useDeletePlanChecklistItem";
import { useGetBedPlan } from "@/src/api/queries/bedPlan/useGetBedPlan";
import { useRecomputeBedPlan } from "@/src/api/queries/bedPlan/useRecomputeBedPlan";
import { useUpdatePlanChecklistItem } from "@/src/api/queries/bedPlan/useUpdatePlanChecklistItem";
import { Screen } from "@/src/components/Screen";
import CustomHeader from "@/src/components/navigation/CustomHeader";
import { OFFLINE_MUTATION_MESSAGE } from "@/src/features/network/offline";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { AddManualChecklistItemSheet } from "../_components/plan/AddManualChecklistItemSheet";
import { BedPlanHeaderCard } from "../_components/plan/BedPlanHeaderCard";
import { EditManualChecklistItemSheet } from "../_components/plan/EditManualChecklistItemSheet";
import { PlanChecklistSection } from "../_components/plan/PlanChecklistSection";
import { PlanErrorState } from "../_components/plan/PlanErrorState";
import { PlannedPlantingsList } from "../_components/plan/PlannedPlantingsList";

const DELETE_SNACKBAR_DURATION_MS = 3000;

export default function BedPlanScreen() {
  const { bedId } = useLocalSearchParams<{ bedId?: string | string[] }>();
  const resolvedBedId = Array.isArray(bedId) ? bedId[0] : bedId;
  const router = useRouter();
  const isOffline = useIsOffline();
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanChecklistItem | null>(
    null,
  );
  const [pendingDeletionItem, setPendingDeletionItem] =
    useState<PlanChecklistItem | null>(null);
  const [optimisticallyHiddenItemIds, setOptimisticallyHiddenItemIds] =
    useState<string[]>([]);
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const deleteSessionRef = useRef(0);

  const bedPlanQuery = useGetBedPlan(resolvedBedId ?? null);
  const recomputePlan = useRecomputeBedPlan(resolvedBedId ?? null);
  const createChecklistItem = useCreatePlanChecklistItem(resolvedBedId ?? null);
  const updateChecklistItem = useUpdatePlanChecklistItem(resolvedBedId ?? null);
  const deleteChecklistItem = useDeletePlanChecklistItem(resolvedBedId ?? null);

  const isBusy =
    recomputePlan.isPending ||
    createChecklistItem.isPending ||
    updateChecklistItem.isPending ||
    deleteChecklistItem.isPending;

  const checklistItems = useMemo(
    () => bedPlanQuery.data?.checklistItems ?? [],
    [bedPlanQuery.data?.checklistItems],
  );
  const visibleChecklistItems = useMemo(
    () =>
      checklistItems.filter(
        (item) => !optimisticallyHiddenItemIds.includes(item.id),
      ),
    [checklistItems, optimisticallyHiddenItemIds],
  );

  useEffect(() => {
    return () => {
      if (pendingDeleteTimerRef.current) {
        clearTimeout(pendingDeleteTimerRef.current);
        pendingDeleteTimerRef.current = null;
      }
    };
  }, []);

  const handleOfflineGuard = () => {
    if (!isOffline) return false;
    Alert.alert("Tryb offline", OFFLINE_MUTATION_MESSAGE);
    return true;
  };

  const handleRecompute = async () => {
    if (handleOfflineGuard()) return;
    try {
      await recomputePlan.mutateAsync();
      setSnackbarMessage("Plan został przeliczony.");
    } catch (error) {
      setSnackbarMessage(String(getResponseError(error)));
    }
  };

  const handleStatusChange = async (
    itemId: string,
    status: PlanChecklistStatus,
  ) => {
    if (handleOfflineGuard()) return;
    try {
      await updateChecklistItem.mutateAsync({
        itemId,
        payload: { status },
      });
    } catch (error) {
      setSnackbarMessage(String(getResponseError(error)));
    }
  };

  const handleDelete = async (itemId: string) => {
    if (handleOfflineGuard()) return;
    if (pendingDeletionItem) {
      setSnackbarMessage(
        "Najpierw zakończ cofanie poprzedniego usunięcia (Przywróć lub poczekaj).",
      );
      return;
    }
    const deletedItem =
      checklistItems.find((item) => item.id === itemId) ?? null;
    if (!deletedItem) return;

    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }

    setPendingDeletionItem(deletedItem);
    setOptimisticallyHiddenItemIds((prev) =>
      prev.includes(itemId) ? prev : [...prev, itemId],
    );
    setSnackbarMessage("Punkt checklisty został usunięty.");

    const currentSessionId = deleteSessionRef.current + 1;
    deleteSessionRef.current = currentSessionId;

    pendingDeleteTimerRef.current = setTimeout(() => {
      void handleFinalizeDelete(itemId, currentSessionId);
    }, DELETE_SNACKBAR_DURATION_MS);
  };

  const handleFinalizeDelete = async (itemId: string, sessionId: number) => {
    if (sessionId !== deleteSessionRef.current) {
      return;
    }

    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }

    if (pendingDeletionItem?.id !== itemId) {
      return;
    }

    setPendingDeletionItem((current) =>
      current?.id === itemId ? null : current,
    );

    try {
      await deleteChecklistItem.mutateAsync(itemId);
      setOptimisticallyHiddenItemIds((prev) =>
        prev.filter((id) => id !== itemId),
      );
      setSnackbarMessage(null);
    } catch (error) {
      setOptimisticallyHiddenItemIds((prev) =>
        prev.filter((id) => id !== itemId),
      );
      setSnackbarMessage(String(getResponseError(error)));
    }
  };

  const handleUndoDelete = () => {
    if (!pendingDeletionItem) return;

    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current);
      pendingDeleteTimerRef.current = null;
    }
    deleteSessionRef.current += 1;

    setOptimisticallyHiddenItemIds((prev) =>
      prev.filter((id) => id !== pendingDeletionItem.id),
    );
    setPendingDeletionItem(null);
    setSnackbarMessage("Przywrócono punkt checklisty.");
  };

  const handleCreateManual = async (values: {
    title: string;
    description?: string | null;
  }) => {
    if (handleOfflineGuard()) return;
    try {
      await createChecklistItem.mutateAsync({
        title: values.title,
        description: values.description,
        scope: "bed",
        priority: "medium",
      });
      setAddSheetVisible(false);
      setSnackbarMessage("Dodano punkt do checklisty.");
    } catch (error) {
      setSnackbarMessage(String(getResponseError(error)));
    }
  };

  const handleEditManual = async (values: {
    itemId: string;
    title: string;
    description?: string | null;
  }) => {
    if (handleOfflineGuard()) return;
    try {
      await updateChecklistItem.mutateAsync({
        itemId: values.itemId,
        payload: {
          title: values.title,
          description: values.description,
        },
      });
      setEditingItem(null);
      setSnackbarMessage("Zapisano zmiany.");
    } catch (error) {
      setSnackbarMessage(String(getResponseError(error)));
    }
  };

  return (
    <Screen style={styles.screen} safeAreaEdges={["left", "right"]}>
      <CustomHeader title="Plan grządki" showBack />

      {bedPlanQuery.isLoading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator />
        </View>
      ) : bedPlanQuery.error || !bedPlanQuery.data ? (
        <View style={styles.contentWrap}>
          <PlanErrorState onRetry={() => bedPlanQuery.refetch()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <BedPlanHeaderCard
            data={bedPlanQuery.data}
            onRecompute={handleRecompute}
            isRecomputing={recomputePlan.isPending}
            disabled={isOffline}
          />

          <PlannedPlantingsList
            items={bedPlanQuery.data.plannedPlantings}
            onPressPlanting={(plantingId) =>
              router.push(
                `/(tabs)/beds/${bedPlanQuery.data?.bed.id}/plantings/${plantingId}`,
              )
            }
            onPressAddVegetable={() =>
              router.push(
                `/(tabs)/beds/${bedPlanQuery.data?.bed.id}/plantings/new`,
              )
            }
          />

          <PlanChecklistSection
            items={visibleChecklistItems}
            plannedPlantingsCount={bedPlanQuery.data.plannedPlantings.length}
            onChangeStatus={handleStatusChange}
            onDelete={handleDelete}
            onEdit={(item) => {
              if (item.source !== "manual") return;
              setEditingItem(item);
            }}
            onAddManual={() => setAddSheetVisible(true)}
            onRecompute={handleRecompute}
            disabled={isBusy || isOffline || Boolean(pendingDeletionItem)}
          />
        </ScrollView>
      )}

      <AddManualChecklistItemSheet
        visible={addSheetVisible}
        onDismiss={() => setAddSheetVisible(false)}
        onSubmit={handleCreateManual}
        isSubmitting={createChecklistItem.isPending}
      />

      <EditManualChecklistItemSheet
        item={editingItem}
        visible={Boolean(editingItem)}
        onDismiss={() => setEditingItem(null)}
        onSubmit={handleEditManual}
        isSubmitting={updateChecklistItem.isPending}
      />

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage(null)}
        duration={DELETE_SNACKBAR_DURATION_MS}
        action={
          pendingDeletionItem
            ? {
                label: "Przywróć",
                onPress: () => {
                  handleUndoDelete();
                },
              }
            : undefined
        }
      >
        {snackbarMessage}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#F7F8F5",
  },
  contentWrap: {
    padding: 16,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 14,
  },
});
