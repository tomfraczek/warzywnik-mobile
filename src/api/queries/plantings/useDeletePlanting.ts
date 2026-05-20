import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedPlanKeys } from "../bedPlan/bedPlanKeys";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "./plantingKeys";

const deletePlanting = async (id: string) => {
  await restClient.delete(`/plantings/${id}`);
  return id;
};

export const useDeletePlanting = (bedId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePlanting,
    onSuccess: async (deletedId) => {
      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: plantingKeys.all }),
      ];

      if (bedId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: plantingKeys.list({ bedId }),
          }),
          queryClient.invalidateQueries({ queryKey: bedKeys.detail(bedId) }),
          queryClient.invalidateQueries({
            queryKey: bedPlanKeys.byBed(bedId),
          }),
        );
      }

      await Promise.all(invalidations);
      queryClient.removeQueries({ queryKey: plantingKeys.detail(deletedId) });
    },
  });
};
