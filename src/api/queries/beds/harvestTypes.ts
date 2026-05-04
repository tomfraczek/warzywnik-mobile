export type HarvestConfirmationAnswer = "yes" | "no";

export type PostHarvestActionTemplate = {
  id: string;
  slug: string;
  name: string;
  target?: string;
  type?: string;
  description?: string | null;
  defaultDueOffsetDays?: number | null;
};

export type PostHarvestProposal = {
  actionTemplate: PostHarvestActionTemplate;
  offsetDays: number;
  schedule: "ONCE" | "EVERY_N_DAYS";
  everyNDays: number | null;
  occurrencesLimit: number | null;
};

export type HarvestPromptItem = {
  bedId: string;
  plantingId: string;
  title: string;
};

export type BedHarvestPromptsResponse = {
  items: HarvestPromptItem[];
};

export type HarvestConfirmationResponse = {
  bedId: string;
  plantingId: string;
  proposals: PostHarvestProposal[];
};

export type CreateBedActionTaskItemDto = {
  actionTemplateId: string;
  dueDate?: string;
};

export type CreateBedActionTasksBulkDto = {
  items: CreateBedActionTaskItemDto[];
};
