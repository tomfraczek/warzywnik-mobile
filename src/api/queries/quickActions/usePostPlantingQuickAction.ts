import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionTaskKeys } from "../actionTasks/actionTaskKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { quickActionKeys } from "./quickActionKeys";
import { PostPlantingQuickActionDto } from "./types";

const postPlantingQuickAction = async (
  plantingId: string,
  payload: PostPlantingQuickActionDto,
): Promise<void> => {
  await restClient.post(`/plantings/${plantingId}/quick-actions`, payload);
};

export const usePostPlantingQuickAction = (plantingId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostPlantingQuickActionDto) =>
      postPlantingQuickAction(plantingId as string, payload),
    onSuccess: async () => {
      if (!plantingId) return;

      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.planting(plantingId),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: plantingKeys.timeline(plantingId),
        }),
        queryClient.invalidateQueries({
          queryKey: plantingKeys.detail(plantingId),
        }),
        queryClient.invalidateQueries({
          queryKey: plantingKeys.seasonComparison(plantingId),
        }),
        queryClient.invalidateQueries({
          queryKey: quickActionKeys.plantingNotes(plantingId),
        }),
        queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar"] }),
      ]);
    },
  });
};
