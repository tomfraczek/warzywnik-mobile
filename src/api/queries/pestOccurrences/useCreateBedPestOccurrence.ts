import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";
import { CreatePestOccurrenceDto, PestOccurrence } from "./types";

const createPlantingPestOccurrence = async (
  plantingId: string,
  payload: CreatePestOccurrenceDto,
): Promise<PestOccurrence> => {
  const { data } = await restClient.post(
    `/plantings/${plantingId}/pest-occurrences`,
    payload,
  );
  return data;
};

export const useCreatePlantingPestOccurrence = (plantingId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePestOccurrenceDto) =>
      createPlantingPestOccurrence(plantingId as string, payload),
    onSuccess: () => {
      if (plantingId) {
        queryClient.invalidateQueries({
          queryKey: pestOccurrenceKeys.list({ plantingId, status: "active" }),
        });
        queryClient.invalidateQueries({
          queryKey: pestOccurrenceKeys.list({ plantingId, status: "all" }),
        });
      }
      queryClient.invalidateQueries({ queryKey: pestOccurrenceKeys.all });
    },
  });
};

export const useCreateBedPestOccurrence = useCreatePlantingPestOccurrence;
