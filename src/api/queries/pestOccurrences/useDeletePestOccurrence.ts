import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";

const deletePestOccurrence = async (id: string) => {
  const { data } = await restClient.delete(`/pest-occurrences/${id}`);
  return data;
};

export const useDeletePestOccurrence = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mutationId?: string) =>
      deletePestOccurrence((mutationId ?? id) as string),
    onSuccess: (_, mutationId) => {
      const targetId = (mutationId ?? id) as string;
      queryClient.invalidateQueries({
        queryKey: pestOccurrenceKeys.detail(targetId),
      });
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
      queryClient.invalidateQueries({
        queryKey: ["plantings", "timeline"],
        exact: false,
      });
    },
  });
};
