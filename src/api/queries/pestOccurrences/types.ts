export type PestOccurrenceStatus = "suspected" | "confirmed" | "resolved";

export type PestOccurrence = {
  id: string;
  bedId?: string | null;
  pestId?: string | null;
  status: PestOccurrenceStatus;
  nextCheckAt?: string | null;
  reminderCount?: number | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  pest?: {
    id: string;
    slug?: string | null;
    name: string;
  } | null;
};

export type PestOccurrenceListParams = {
  bedId: string;
  status?: "active" | "resolved" | "all";
};

export type CreatePestOccurrenceDto = {
  pestId: string;
  status: "suspected" | "confirmed";
  notes?: string | null;
};

export type UpdatePestOccurrenceDto = Partial<
  Omit<CreatePestOccurrenceDto, "status">
> & {
  status?: PestOccurrenceStatus;
};
