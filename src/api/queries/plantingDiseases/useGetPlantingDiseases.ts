import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { plantingDiseaseKeys } from "./plantingDiseaseKeys";
import { PlantingDisease, PlantingDiseaseListParams } from "./types";

const getPlantingDiseases = async (
  params: PlantingDiseaseListParams,
): Promise<PlantingDisease[]> => {
  const { data } = await restClient.get(
    `/plantings/${params.plantingId}/disease-occurrences`,
    {
      params: {
        status: params.status ?? "active",
      },
    },
  );
  return data;
};

export const useGetPlantingDiseases = (
  params: PlantingDiseaseListParams | null,
) => {
  return useQuery({
    queryKey: params
      ? plantingDiseaseKeys.list(params)
      : plantingDiseaseKeys.list({ plantingId: "unknown" }),
    queryFn: () => getPlantingDiseases(params as PlantingDiseaseListParams),
    enabled: Boolean(params?.plantingId),
  });
};
