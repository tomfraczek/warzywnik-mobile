import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";
import {
  HarvestConfirmationAnswer,
  HarvestConfirmationResponse,
} from "../beds/harvestTypes";

type HarvestConfirmationPayload = {
  answer: HarvestConfirmationAnswer;
};

const postHarvestConfirmation = async (
  plantingId: string,
  payload: HarvestConfirmationPayload,
): Promise<HarvestConfirmationResponse> => {
  const { data } = await restClient.post(
    `/plantings/${plantingId}/harvest-confirmation`,
    payload,
  );

  return {
    bedId: data?.bedId,
    plantingId: data?.plantingId,
    proposals: data?.proposals ?? data?.postHarvestActions ?? [],
  };
};

export const usePostHarvestConfirmation = (plantingId: string | null) => {
  return useMutation({
    mutationFn: (payload: HarvestConfirmationPayload) =>
      postHarvestConfirmation(plantingId as string, payload),
  });
};
