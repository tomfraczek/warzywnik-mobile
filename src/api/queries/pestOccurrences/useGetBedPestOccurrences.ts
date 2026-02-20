import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";
import { PestOccurrence, PestOccurrenceListParams } from "./types";

const getPlantingPestOccurrences = async (
  params: PestOccurrenceListParams,
): Promise<PestOccurrence[]> => {
  const { data } = await restClient.get(
    `/plantings/${params.plantingId}/pest-occurrences`,
    {
      params: {
        status: params.status,
      },
    },
  );
  return data;
};

export const useGetPlantingPestOccurrences = (
  plantingId: string | null,
  status?: PestOccurrenceListParams["status"],
) => {
  const params = plantingId ? { plantingId, status } : null;
  return useQuery({
    queryKey: params
      ? pestOccurrenceKeys.list(params)
      : pestOccurrenceKeys.list({ plantingId: "unknown" }),
    queryFn: () =>
      getPlantingPestOccurrences(params as PestOccurrenceListParams),
    enabled: Boolean(plantingId),
  });
};

export const useGetBedPestOccurrences = useGetPlantingPestOccurrences;
