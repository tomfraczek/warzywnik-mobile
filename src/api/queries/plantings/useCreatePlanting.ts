import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: plantingKeys.list({ bedId: variables.bedId }),
      });
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
    },
  });
};
