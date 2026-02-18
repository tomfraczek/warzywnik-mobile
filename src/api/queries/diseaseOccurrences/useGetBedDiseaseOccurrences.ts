import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { diseaseOccurrenceKeys } from "./diseaseOccurrenceKeys";
import { DiseaseOccurrence, DiseaseOccurrenceListParams } from "./types";

const getBedDiseaseOccurrences = async (
  params: DiseaseOccurrenceListParams,
): Promise<DiseaseOccurrence[]> => {
  const { data } = await restClient.get(
    `/beds/${params.bedId}/disease-occurrences`,
    {
      params: {
        status: params.status,
      },
    },
  );
  return data;
};

export const useGetBedDiseaseOccurrences = (bedId: string | null) => {
  const params = bedId ? { bedId } : null;
  return useQuery({
    queryKey: params
      ? diseaseOccurrenceKeys.list(params)
      : diseaseOccurrenceKeys.list({ bedId: "unknown" }),
    queryFn: () =>
      getBedDiseaseOccurrences(params as DiseaseOccurrenceListParams),
    enabled: Boolean(bedId),
  });
};
