export type HarvestConfirmationAnswer = "yes" | "no";

export type ActionTemplate = {
  templateId?: string;
  id?: string;
  name: string;
  description?: string | null;
  defaultDueOffsetDays?: number | null;
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
  postHarvestActions: ActionTemplate[];
};

export type CreateBedActionTaskItemDto = {
  templateId: string;
  dueAt?: string;
};

export type CreateBedActionTasksBulkDto = {
  items: CreateBedActionTaskItemDto[];
};
