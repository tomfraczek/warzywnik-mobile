import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { UpdateHarvestResultDto } from "./learningTypes";
import { plantingKeys } from "./plantingKeys";
import { Planting } from "./types";

const updateHarvestResult = async (params: {
  id: string;
  payload: UpdateHarvestResultDto;
}): Promise<Planting> => {
  const { data } = await restClient.patch(
    `/plantings/${params.id}/harvest-result`,
    params.payload,
  );
  return data;
};

export const useUpdateHarvestResult = (id: string, bedId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateHarvestResultDto) =>
      updateHarvestResult({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantingKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: plantingKeys.seasonComparison(id),
      });
      if (bedId) {
        queryClient.invalidateQueries({ queryKey: bedKeys.seasons(bedId) });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.list({ bedId }),
        });
      }
    },
  });
};
