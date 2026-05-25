import { restClient } from "@/src/api/axios";
import {
  getTaskAffectedPlantingIds,
  getTaskOwnerId,
  getTaskOwnerScope,
} from "@/src/features/tasks/model";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { actionTaskKeys } from "./actionTaskKeys";

const deleteActionTask = async (id: string): Promise<void> => {
  await restClient.delete(`/action-tasks/${id}`);
};

export const useDeleteActionTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params:
        | string
        | {
            id: string;
            ownerScopeType?: string | null;
            ownerScopeId?: string | null;
            bedId?: string | null;
            plantingId?: string | null;
            affectedPlantingIds?: string[];
            meta?: Record<string, unknown> | null;
            metadata?: Record<string, unknown> | null;
          },
    ) => deleteActionTask(typeof params === "string" ? params : params.id),
    onSuccess: (_, params) => {
      const context = typeof params === "string" ? null : params;

      queryClient.invalidateQueries({ queryKey: actionTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });

      const ownerScope = context ? getTaskOwnerScope(context) : null;
      const ownerId = context ? getTaskOwnerId(context) : null;
      const bedId =
        context && ownerScope === "bed"
          ? (ownerId ?? context.bedId)
          : context?.bedId;

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
      if (context && ownerScope === "planting" && ownerId) {
        plantingIds.add(ownerId);
      }
      if (context?.plantingId) {
        plantingIds.add(context.plantingId);
      }
      if (context) {
        getTaskAffectedPlantingIds(context).forEach((plantingId) => {
          plantingIds.add(plantingId);
        });
      }

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
