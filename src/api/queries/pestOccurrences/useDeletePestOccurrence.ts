import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";

const deletePestOccurrence = async (id: string) => {
  const { data } = await restClient.delete(`/pest-occurrences/${id}`);
  return data;
};

export const useDeletePestOccurrence = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePestOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pestOccurrenceKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
    },
  });
};
