export type DiseaseOccurrenceStatus = "suspected" | "confirmed" | "resolved";

export type DiseaseOccurrence = {
  id: string;
  bedId?: string | null;
  diseaseId?: string | null;
  status: DiseaseOccurrenceStatus;
  nextCheckAt?: string | null;
  reminderCount?: number | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  disease?: {
    id: string;
    slug?: string | null;
    name: string;
  } | null;
};

export type DiseaseOccurrenceListParams = {
  bedId: string;
  status?: "active" | "resolved" | "all";
};

export type CreateDiseaseOccurrenceDto = {
  diseaseId: string;
  status: "suspected" | "confirmed";
  notes?: string | null;
};

export type UpdateDiseaseOccurrenceDto = Partial<
  Omit<CreateDiseaseOccurrenceDto, "status">
> & {
  status?: DiseaseOccurrenceStatus;
};
