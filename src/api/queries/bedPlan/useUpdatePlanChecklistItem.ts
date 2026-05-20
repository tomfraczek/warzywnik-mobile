import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { bedPlanKeys } from "./bedPlanKeys";
import { PlanChecklistItem, UpdatePlanChecklistItemDto } from "./types";

const updatePlanChecklistItem = async (params: {
  itemId: string;
  payload: UpdatePlanChecklistItemDto;
}): Promise<PlanChecklistItem> => {
  const { data } = await restClient.patch<PlanChecklistItem>(
    `/plan-checklist/${params.itemId}`,
    params.payload,
  );
  return data;
};

export const useUpdatePlanChecklistItem = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      itemId: string;
      payload: UpdatePlanChecklistItemDto;
    }) => updatePlanChecklistItem(params),
    onSuccess: async () => {
      if (!bedId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bedPlanKeys.byBed(bedId) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
      ]);
    },
  });
};
