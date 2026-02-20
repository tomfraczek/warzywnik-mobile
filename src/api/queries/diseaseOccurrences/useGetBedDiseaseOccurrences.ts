import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";
import { DiseaseOccurrence, DiseaseOccurrenceListParams } from "./types";

const getPlantingDiseaseOccurrences = async (
  params: DiseaseOccurrenceListParams,
): Promise<DiseaseOccurrence[]> => {
  const { data } = await restClient.get(
    `/plantings/${params.plantingId}/disease-occurrences`,
    {
      params: {
        status: params.status,
      },
    },
  );
  return data;
};

export const useGetPlantingDiseaseOccurrences = (
  plantingId: string | null,
  status?: DiseaseOccurrenceListParams["status"],
) => {
  const params = plantingId ? { plantingId, status } : null;
  return useQuery({
    queryKey: params
      ? diseaseOccurrenceKeys.list(params)
      : diseaseOccurrenceKeys.list({ plantingId: "unknown" }),
    queryFn: () =>
      getPlantingDiseaseOccurrences(params as DiseaseOccurrenceListParams),
    enabled: Boolean(plantingId),
  });
};

export const useGetBedDiseaseOccurrences = useGetPlantingDiseaseOccurrences;
