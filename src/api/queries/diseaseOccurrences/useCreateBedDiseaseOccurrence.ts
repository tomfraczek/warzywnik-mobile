import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plantingKeys } from "../plantings/plantingKeys";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";
import { CreateDiseaseOccurrenceDto, DiseaseOccurrence } from "./types";

const createPlantingDiseaseOccurrence = async (
  plantingId: string,
  payload: CreateDiseaseOccurrenceDto,
): Promise<DiseaseOccurrence> => {
  const { data } = await restClient.post(
    `/plantings/${plantingId}/disease-occurrences`,
    payload,
  );
  return data;
};

export const useCreatePlantingDiseaseOccurrence = (
  plantingId: string | null,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDiseaseOccurrenceDto) =>
      createPlantingDiseaseOccurrence(plantingId as string, payload),
    onSuccess: () => {
      if (plantingId) {
        queryClient.invalidateQueries({
          queryKey: diseaseOccurrenceKeys.list({
            plantingId,
            status: "active",
          }),
        });
        queryClient.invalidateQueries({
          queryKey: diseaseOccurrenceKeys.list({ plantingId, status: "all" }),
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.timeline(plantingId),
        });
      }
      queryClient.invalidateQueries({ queryKey: diseaseOccurrenceKeys.all });
    },
  });
};

export const useCreateBedDiseaseOccurrence = useCreatePlantingDiseaseOccurrence;
