import { getResponseError } from "@/src/api/axios";
import { useDeleteActionTask } from "@/src/api/queries/actionTasks/useDeleteActionTask";
import { useUpdateActionTask } from "@/src/api/queries/actionTasks/useUpdateActionTask";
import { TaskItem } from "@/src/api/queries/users/meTypes";
import { useIsOffline } from "@/src/hooks/useNetworkStatus";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert } from "react-native";

const OFFLINE_ACTION_MESSAGE =
  "Połącz się z internetem, aby zmienić status zadania";

export function usePlannerActions() {
  const isOffline = useIsOffline();
  const updateTask = useUpdateActionTask();
  const deleteTask = useDeleteActionTask();
  const queryClient = useQueryClient();
  const [busyTaskIds, setBusyTaskIds] = useState<Set<string>>(new Set());

  const setTaskBusy = (taskId: string, isBusy: boolean) => {
    setBusyTaskIds((prev) => {
      const next = new Set(prev);
      if (isBusy) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const waitForPlannerSync = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["me", "tasks", "pending"] }),
      queryClient.refetchQueries({ queryKey: ["me", "tasks", "done"] }),
      queryClient.refetchQueries({ queryKey: ["calendar"] }),
    ]);
  };

  const completeTask = async (task: TaskItem) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_ACTION_MESSAGE);
      return;
    }

    setTaskBusy(task.id, true);

    try {
      await updateTask.mutateAsync({
        id: task.id,
        payload: { status: "done" },
      });
      await waitForPlannerSync();
    } catch (error) {
      Alert.alert("Nie udało się zapisać", String(getResponseError(error)));
    } finally {
      setTaskBusy(task.id, false);
    }
  };

  const removeTask = (task: TaskItem) => {
    if (isOffline) {
      Alert.alert("Tryb offline", OFFLINE_ACTION_MESSAGE);
      return;
    }

    Alert.alert("Usunąć zadanie?", "Tej operacji nie można cofnąć.", [
      { text: "Anuluj", style: "cancel" },
      {
        text: "Usuń",
        style: "destructive",
        onPress: () => {
          setTaskBusy(task.id, true);
          deleteTask.mutate(
            {
              id: task.id,
              ownerScopeType:
                typeof task.ownerScopeType === "string"
                  ? task.ownerScopeType
                  : null,
              ownerScopeId:
                typeof task.ownerScopeId === "string"
                  ? task.ownerScopeId
                  : null,
              relationType:
                typeof task.relationType === "string"
                  ? task.relationType
                  : null,
              bedId: task.bedId,
              plantingId: task.plantingId,
              growingSpaceId:
                typeof task.growingSpaceId === "string"
                  ? task.growingSpaceId
                  : null,
              affectedPlantingIds: Array.isArray(task.affectedPlantingIds)
                ? task.affectedPlantingIds
                : undefined,
              meta:
                typeof task.meta === "object" && task.meta
                  ? (task.meta as Record<string, unknown>)
                  : null,
              metadata:
                typeof task.metadata === "object" && task.metadata
                  ? (task.metadata as Record<string, unknown>)
                  : null,
            },
            {
              onSuccess: async () => {
                await waitForPlannerSync();
              },
              onError: (error) => {
                Alert.alert(
                  "Nie udało się usunąć",
                  String(getResponseError(error)),
                );
              },
              onSettled: () => {
                setTaskBusy(task.id, false);
              },
            },
          );
        },
      },
    ]);
  };

  return {
    isOffline,
    isMutating:
      updateTask.isPending || deleteTask.isPending || busyTaskIds.size > 0,
    isTaskBusy: (taskId: string) => busyTaskIds.has(taskId),
    completeTask,
    removeTask,
  };
}
