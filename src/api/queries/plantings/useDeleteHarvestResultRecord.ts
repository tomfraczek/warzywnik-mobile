import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import { plantingKeys } from "./plantingKeys";

const deleteHarvestResultRecord = async (params: {
  id: string;
  recordId: string;
}) => {
  await restClient.delete(
    `/plantings/${params.id}/harvest-results/${params.recordId}`,
  );
};

export const useDeleteHarvestResultRecord = (id: string, bedId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordId: string) =>
      deleteHarvestResultRecord({ id, recordId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: plantingKeys.timeline(id) });
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
