export type PestOccurrenceStatus = "suspected" | "confirmed" | "resolved";

export type PestOccurrence = {
  id: string;
  plantingId: string;
  pestId?: string | null;
  status: PestOccurrenceStatus;
  nextCheckAt?: string | null;
  reminderCount?: number;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  pest?: {
    id: string;
    slug?: string | null;
    name: string;
  } | null;
};

export type PestOccurrenceListParams = {
  plantingId: string;
  status?: "active" | "resolved" | "all";
};

export type CreatePestOccurrenceDto = {
  pestId: string;
  status?: PestOccurrenceStatus;
  notes?: string | null;
};

export type UpdatePestOccurrenceDto = Partial<
  Omit<CreatePestOccurrenceDto, "status">
> & {
  status?: PestOccurrenceStatus;
};
