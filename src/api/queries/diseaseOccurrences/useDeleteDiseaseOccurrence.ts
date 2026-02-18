import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";

const deleteDiseaseOccurrence = async (id: string) => {
  const { data } = await restClient.delete(`/disease-occurrences/${id}`);
  return data;
};

export const useDeleteDiseaseOccurrence = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteDiseaseOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: diseaseOccurrenceKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: diseaseOccurrenceKeys.all });
    },
  });
};
