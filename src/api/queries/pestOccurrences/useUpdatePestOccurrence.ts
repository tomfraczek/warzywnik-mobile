import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";
import { PestOccurrence, UpdatePestOccurrenceDto } from "./types";

const updatePestOccurrence = async (
  id: string,
  payload: UpdatePestOccurrenceDto,
): Promise<PestOccurrence> => {
  const { data } = await restClient.patch(`/pest-occurrences/${id}`, payload);
  return data;
};

export const useUpdatePestOccurrence = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePestOccurrenceDto) =>
      updatePestOccurrence(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: pestOccurrenceKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
    },
  });
};
