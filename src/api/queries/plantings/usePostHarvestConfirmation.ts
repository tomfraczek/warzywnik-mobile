import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "../beds/bedKeys";
import {
  HarvestConfirmationAnswer,
  HarvestConfirmationResponse,
  PostHarvestProposal,
} from "../beds/harvestTypes";
import { plantingKeys } from "./plantingKeys";

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

  const rawProposals = Array.isArray(data?.proposals)
    ? data.proposals
    : Array.isArray(data?.postHarvestActions)
      ? data.postHarvestActions
      : [];

  const proposals: PostHarvestProposal[] = rawProposals
    .map((proposal: any) => {
      const rawTemplate = proposal?.actionTemplate ?? proposal ?? null;
      const templateId =
        rawTemplate?.id ??
        rawTemplate?.actionTemplateId ??
        rawTemplate?.templateId ??
        null;

      if (!templateId || !rawTemplate?.name) {
        return null;
      }

      return {
        actionTemplate: {
          id: String(templateId),
          slug: String(rawTemplate?.slug ?? rawTemplate?.name ?? templateId),
          name: String(rawTemplate?.name),
          target:
            typeof rawTemplate?.target === "string"
              ? rawTemplate.target
              : undefined,
          type:
            typeof rawTemplate?.type === "string"
              ? rawTemplate.type
              : undefined,
          description:
            typeof rawTemplate?.description === "string"
              ? rawTemplate.description
              : (rawTemplate?.description ?? null),
          defaultDueOffsetDays:
            typeof rawTemplate?.defaultDueOffsetDays === "number"
              ? rawTemplate.defaultDueOffsetDays
              : null,
        },
        offsetDays:
          typeof proposal?.offsetDays === "number"
            ? proposal.offsetDays
            : typeof rawTemplate?.defaultDueOffsetDays === "number"
              ? rawTemplate.defaultDueOffsetDays
              : 0,
        schedule:
          proposal?.schedule === "EVERY_N_DAYS" ? "EVERY_N_DAYS" : "ONCE",
        everyNDays:
          typeof proposal?.everyNDays === "number" ? proposal.everyNDays : null,
        occurrencesLimit:
          typeof proposal?.occurrencesLimit === "number"
            ? proposal.occurrencesLimit
            : null,
      } as PostHarvestProposal;
    })
    .filter((item: PostHarvestProposal | null): item is PostHarvestProposal =>
      Boolean(item),
    );

  return {
    bedId: data?.bedId ?? "",
    plantingId: data?.plantingId ?? plantingId,
    proposals,
  };
};

export const usePostHarvestConfirmation = (plantingId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HarvestConfirmationPayload) =>
      postHarvestConfirmation(plantingId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["harvest-prompts"] });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: bedKeys.all });
      queryClient.invalidateQueries({ queryKey: plantingKeys.all });
      if (plantingId) {
        queryClient.invalidateQueries({
          queryKey: plantingKeys.detail(plantingId),
        });
        queryClient.invalidateQueries({
          queryKey: plantingKeys.timeline(plantingId),
        });
      }
    },
  });
};
