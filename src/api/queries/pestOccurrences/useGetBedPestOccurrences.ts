import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { pestOccurrenceKeys } from "./pestOccurrenceKeys";
import { PestOccurrence, PestOccurrenceListParams } from "./types";

const getBedPestOccurrences = async (
  params: PestOccurrenceListParams,
): Promise<PestOccurrence[]> => {
  const { data } = await restClient.get(
    `/beds/${params.bedId}/pest-occurrences`,
    {
      params: {
        status: params.status,
      },
    },
  );
  return data;
};

export const useGetBedPestOccurrences = (bedId: string | null) => {
  const params = bedId ? { bedId } : null;
  return useQuery({
    queryKey: params
      ? pestOccurrenceKeys.list(params)
      : pestOccurrenceKeys.list({ bedId: "unknown" }),
    queryFn: () => getBedPestOccurrences(params as PestOccurrenceListParams),
    enabled: Boolean(bedId),
  });
};
