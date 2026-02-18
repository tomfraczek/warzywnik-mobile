import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";
import { CreateDiseaseOccurrenceDto, DiseaseOccurrence } from "./types";

const createBedDiseaseOccurrence = async (
  bedId: string,
  payload: CreateDiseaseOccurrenceDto,
): Promise<DiseaseOccurrence> => {
  const { data } = await restClient.post(
    `/beds/${bedId}/disease-occurrences`,
    payload,
  );
  return data;
};

export const useCreateBedDiseaseOccurrence = (bedId: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDiseaseOccurrenceDto) =>
      createBedDiseaseOccurrence(bedId as string, payload),
    onSuccess: () => {
      if (bedId) {
        queryClient.invalidateQueries({
          queryKey: diseaseOccurrenceKeys.list({ bedId }),
        });
      }
      queryClient.invalidateQueries({ queryKey: diseaseOccurrenceKeys.all });
    },
  });
};
