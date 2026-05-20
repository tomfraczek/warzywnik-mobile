import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedPlanKeys } from "../bedPlan/bedPlanKeys";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "./plantingKeys";
import { CreatePlantingDto, Planting, PlantingMutationResponse } from "./types";

const createPlanting = async (
  payload: CreatePlantingDto,
): Promise<PlantingMutationResponse | Planting> => {
  const { data } = await restClient.post("/plantings", payload);
  return data;
};

export const useCreatePlanting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlanting,
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: plantingKeys.list({ bedId: variables.bedId }),
        }),
        queryClient.invalidateQueries({ queryKey: plantingKeys.all }),
        queryClient.invalidateQueries({
          queryKey: bedKeys.detail(variables.bedId),
        }),
        queryClient.invalidateQueries({
          queryKey: bedPlanKeys.byBed(variables.bedId),
        }),
      ]);
    },
  });
};
