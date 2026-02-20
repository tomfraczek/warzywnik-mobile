export type DiseaseOccurrenceStatus = "suspected" | "confirmed" | "resolved";

export type DiseaseSeverity = "low" | "medium" | "high";

export type DiseaseOccurrence = {
  id: string;
  plantingId: string;
  diseaseId?: string | null;
  status: DiseaseOccurrenceStatus;
  nextCheckAt?: string | null;
  reminderCount?: number;
  severity?: DiseaseSeverity | null;
  observedAt?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  disease?: {
    id: string;
    slug?: string | null;
    name: string;
  } | null;
};

export type DiseaseOccurrenceListParams = {
  plantingId: string;
  status?: "active" | "resolved" | "all";
};

export type CreateDiseaseOccurrenceDto = {
  diseaseId: string;
  status?: DiseaseOccurrenceStatus;
  severity?: DiseaseSeverity | null;
  observedAt?: string;
  notes?: string | null;
};

export type UpdateDiseaseOccurrenceDto = Partial<
  Omit<CreateDiseaseOccurrenceDto, "status">
> & {
  status?: DiseaseOccurrenceStatus;
};
