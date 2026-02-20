import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";
import { DiseaseOccurrence, UpdateDiseaseOccurrenceDto } from "./types";

const updateDiseaseOccurrence = async (
  id: string,
  payload: UpdateDiseaseOccurrenceDto,
): Promise<DiseaseOccurrence> => {
  const { data } = await restClient.patch(
    `/disease-occurrences/${id}`,
    payload,
  );
  return data;
};

export const useUpdateDiseaseOccurrence = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id: mutationId,
      payload,
    }: {
      id?: string;
      payload: UpdateDiseaseOccurrenceDto;
    }) => updateDiseaseOccurrence((mutationId ?? id) as string, payload),
    onSuccess: (_, variables) => {
      const targetId = (variables.id ?? id) as string;
      queryClient.invalidateQueries({
        queryKey: diseaseOccurrenceKeys.detail(targetId),
      });
      queryClient.invalidateQueries({ queryKey: diseaseOccurrenceKeys.all });
    },
  });
};
