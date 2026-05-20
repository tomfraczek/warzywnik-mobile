import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { bedPlanKeys } from "./bedPlanKeys";
import { BedPlanResponse } from "./types";

const recomputeBedPlan = async (bedId: string): Promise<BedPlanResponse> => {
  const { data } = await restClient.post<BedPlanResponse>(
    `/beds/${bedId}/plan/recompute`,
  );
  return data;
};

export const useRecomputeBedPlan = (bedId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recomputeBedPlan(bedId as string),
    onSuccess: async () => {
      if (!bedId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: bedPlanKeys.byBed(bedId) }),
        queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
      ]);
    },
  });
};
