import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { actionTaskKeys } from "../actionTasks/actionTaskKeys";
import { bedPlanKeys } from "../bedPlan/bedPlanKeys";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "./plantingKeys";
import { Planting, PlantingMutationResponse, UpdatePlantingDto } from "./types";

const updatePlanting = async (params: {
  id: string;
  payload: UpdatePlantingDto;
}): Promise<PlantingMutationResponse | Planting> => {
  const { data } = await restClient.patch(
    `/plantings/${params.id}`,
    params.payload,
  );
  return data;
};

export const useUpdatePlanting = (id: string, bedId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePlantingDto) => updatePlanting({ id, payload }),
    onSuccess: async (_updated, payload) => {
      const invalidations: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: plantingKeys.detail(id) }),
        queryClient.invalidateQueries({
          queryKey: plantingKeys.availableStatuses(id),
        }),
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

      if (payload.status) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: ["me", "tasks"] }),
          queryClient.invalidateQueries({ queryKey: ["calendar"] }),
          queryClient.invalidateQueries({ queryKey: actionTaskKeys.all }),
        );
      }

      await Promise.all(invalidations);
    },
  });
};
