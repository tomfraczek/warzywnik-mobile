import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";
import { CreatePestOccurrenceDto, PestOccurrence } from "./types";

const createBedPestOccurrence = async (
  bedId: string,
  payload: CreatePestOccurrenceDto,
): Promise<PestOccurrence> => {
  const { data } = await restClient.post(
    `/beds/${bedId}/pest-occurrences`,
    payload,
  );
  return data;
};

export const useCreateBedPestOccurrence = (bedId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePestOccurrenceDto) =>
      createBedPestOccurrence(bedId as string, payload),
    onSuccess: () => {
      if (bedId) {
        queryClient.invalidateQueries({
          queryKey: pestOccurrenceKeys.list({ bedId }),
        });
      }
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
    },
  });
};
