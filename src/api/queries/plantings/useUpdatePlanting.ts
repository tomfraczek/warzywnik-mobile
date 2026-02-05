import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      if (bedId) {
        queryClient.invalidateQueries({
          queryKey: plantingKeys.list({ bedId }),
        });
      }
    },
  });
};
