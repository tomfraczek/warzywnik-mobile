import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionTaskKeys } from "../actionTasks/actionTaskKeys";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "../plantings/plantingKeys";
import { PostBedQuickActionDto } from "./types";

const postBedQuickAction = async (
  bedId: string,
  payload: PostBedQuickActionDto,
): Promise<void> => {
  await restClient.post(`/beds/${bedId}/quick-actions`, payload);
};

export const usePostBedQuickAction = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PostBedQuickActionDto) =>
      postBedQuickAction(bedId as string, payload),
    onSuccess: async () => {
      if (!bedId) return;

      await Promise.allSettled([
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.bed(bedId, undefined, undefined, "own"),
          exact: false,
        }),
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.bed(
            bedId,
            undefined,
            undefined,
            "includingChildren",
          ),
          exact: false,
        }),
        queryClient.invalidateQueries({ queryKey: actionTaskKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["calendar"] }),
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.seasons(bedId) }),
        queryClient.invalidateQueries({ queryKey: plantingKeys.all }),
      ]);
    },
  });
};
