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

export const useUpdatePestOccurrence = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id: mutationId,
      payload,
    }: {
      id?: string;
      payload: UpdatePestOccurrenceDto;
    }) => updatePestOccurrence((mutationId ?? id) as string, payload),
    onSuccess: (_, variables) => {
      const targetId = (variables.id ?? id) as string;
      queryClient.invalidateQueries({
        queryKey: pestOccurrenceKeys.detail(targetId),
      });
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
    },
  });
};
