import { restClient } from "@/src/api/axios";
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
        | { id: string; bedId?: string | null; plantingId?: string | null },
    ) => deleteActionTask(typeof params === "string" ? params : params.id),
    onSuccess: (_, params) => {
      const context = typeof params === "string" ? null : params;

      queryClient.invalidateQueries({ queryKey: actionTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });

      if (context?.bedId) {
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.bed(
            context.bedId,
            undefined,
            undefined,
            "own",
          ),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: bedKeys.detail(context.bedId),
        });
      }

      if (context?.plantingId) {
        queryClient.invalidateQueries({
          queryKey: actionTaskKeys.planting(context.plantingId),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.detail(context.plantingId),
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.timeline(context.plantingId),
        });
      }

      queryClient.invalidateQueries({ queryKey: bedKeys.all });
      queryClient.invalidateQueries({ queryKey: ["harvest-prompts"] });
    },
  });
};
