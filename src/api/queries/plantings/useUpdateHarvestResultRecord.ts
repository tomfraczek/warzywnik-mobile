import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { CreateHarvestResultRecordDto } from "./learningTypes";
import { plantingKeys } from "./plantingKeys";

const updateHarvestResultRecord = async (params: {
  id: string;
  recordId: string;
  payload: CreateHarvestResultRecordDto;
}) => {
  const { data } = await restClient.patch(
    `/plantings/${params.id}/harvest-results/${params.recordId}`,
    params.payload,
  );
  return data;
};

export const useUpdateHarvestResultRecord = (id: string, bedId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      recordId: string;
      payload: CreateHarvestResultRecordDto;
    }) =>
      updateHarvestResultRecord({
        id,
        recordId: params.recordId,
        payload: params.payload,
      }),
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
