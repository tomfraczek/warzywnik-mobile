import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { CreateHarvestResultRecordDto } from "./learningTypes";
import { plantingKeys } from "./plantingKeys";

const createHarvestResultRecord = async (params: {
  id: string;
  payload: CreateHarvestResultRecordDto;
}) => {
  const { data } = await restClient.post(
    `/plantings/${params.id}/harvest-results`,
    params.payload,
  );
  return data;
};

export const useCreateHarvestResultRecord = (id: string, bedId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHarvestResultRecordDto) =>
      createHarvestResultRecord({ id, payload }),
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
