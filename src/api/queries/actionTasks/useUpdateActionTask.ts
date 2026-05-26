import { restClient } from "@/src/api/axios";
import {
  getTaskAffectedPlantingIds,
  getTaskOwnerId,
  getTaskOwnerScope,
} from "@/src/features/tasks/taskOwnership";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { actionTaskKeys } from "./actionTaskKeys";
import { ActionTask, UpdateActionTaskDto } from "./types";

const updateActionTask = async (params: {
  id: string;
  payload: UpdateActionTaskDto;
}): Promise<ActionTask> => {
  const { data } = await restClient.patch(
    `/action-tasks/${params.id}`,
    params.payload,
  );
  return data as ActionTask;
};

export const useUpdateActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateActionTaskDto;
    }) => updateActionTask({ id, payload }),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: actionTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });

      const ownerScope = getTaskOwnerScope(updatedTask);
      const ownerId = getTaskOwnerId(updatedTask);

      const bedId =
        ownerScope === "bed"
          ? (ownerId ?? updatedTask.bedId)
          : updatedTask.bedId;

      if (bedId) {
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.bed(bedId, undefined, undefined, "own"),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: bedKeys.detail(bedId),
        });
      }

      const plantingIds = new Set<string>();
      if (ownerScope === "planting" && ownerId) {
        plantingIds.add(ownerId);
      }
      if (updatedTask.plantingId) {
        plantingIds.add(updatedTask.plantingId);
      }
      getTaskAffectedPlantingIds(updatedTask).forEach((plantingId) => {
        plantingIds.add(plantingId);
      });

      plantingIds.forEach((plantingId) => {
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.planting(plantingId),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.detail(plantingId),
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.timeline(plantingId),
        });
      });

      queryClient.invalidateQueries({ queryKey: bedKeys.all });
      queryClient.invalidateQueries({ queryKey: ["harvest-prompts"] });
    },
  });
};
