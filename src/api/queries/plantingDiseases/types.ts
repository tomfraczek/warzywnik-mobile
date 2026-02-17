export type PlantingDiseaseStatus = "suspected" | "confirmed" | "resolved";

export type DiseaseSeverity = "low" | "medium" | "high";

export type PlantingDisease = {
  id: string;
  plantingId?: string | null;
  diseaseId?: string | null;
  status: PlantingDiseaseStatus;
  severity?: DiseaseSeverity | null;
  observedAt?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  disease?: {
    id: string;
    slug?: string | null;
    name: string;
  } | null;
};

export type PlantingDiseaseListParams = {
  plantingId: string;
  status?: "active" | "resolved" | "all";
};

export type CreatePlantingDiseaseDto = {
  diseaseId: string;
  status: "suspected" | "confirmed";
  severity?: DiseaseSeverity | null;
  observedAt?: string | null;
  notes?: string | null;
};

export type UpdatePlantingDiseaseDto = Partial<
  Omit<CreatePlantingDiseaseDto, "status">
> & {
  status?: PlantingDiseaseStatus;
};
