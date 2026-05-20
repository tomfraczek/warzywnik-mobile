import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { bedPlanKeys } from "./bedPlanKeys";
import { CreatePlanChecklistItemDto, PlanChecklistItem } from "./types";

const createPlanChecklistItem = async (params: {
  bedId: string;
  payload: CreatePlanChecklistItemDto;
}): Promise<PlanChecklistItem> => {
  const { data } = await restClient.post<PlanChecklistItem>(
    `/beds/${params.bedId}/plan/checklist-items`,
    params.payload,
  );
  return data;
};

export const useCreatePlanChecklistItem = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePlanChecklistItemDto) =>
      createPlanChecklistItem({ bedId: bedId as string, payload }),
    onSuccess: async () => {
      if (!bedId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bedPlanKeys.byBed(bedId) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
      ]);
    },
  });
};
