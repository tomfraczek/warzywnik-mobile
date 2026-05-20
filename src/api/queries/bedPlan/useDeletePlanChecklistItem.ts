import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { bedPlanKeys } from "./bedPlanKeys";

const deletePlanChecklistItem = async (itemId: string): Promise<void> => {
  await restClient.delete(`/plan-checklist/${itemId}`);
};

export const useDeletePlanChecklistItem = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlanChecklistItem,
    onSuccess: async () => {
      if (!bedId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bedPlanKeys.byBed(bedId) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
      ]);
    },
  });
};
