export type PlantingStatus =
  | "PLANNED"
  | "ACTIVE"
  | "HARVESTING"
  | "FINISHED"
  | "CANCELLED";

export type PlantingStartMethod = "DIRECT_SOW" | "TRANSPLANT";

export type WarningSeverity = "INFO" | "WARNING" | "CRITICAL";

export type Warning = {
  code: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  hint?: string | null;
  details?: Record<string, unknown> | null;
};

export type PlantingVegetable = {
  id: string;
  name: string;
};

export type HarvestResultRecord = {
  id: string;
  harvestedAt?: string | null;
  yieldKg?: number | null;
  qualityRating?: number | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Planting = {
  id: string;
  bedId: string;
  bedName?: string | null;
  vegetableId: string;
  vegetable?: PlantingVegetable | null;
  name?: string | null;
  vegetableName?: string | null;
  status: PlantingStatus;
  startMethod?: PlantingStartMethod;
  sowedAt?: string | null;
  plannedStartDate: string;
  actualStartDate?: string | null;
  harvestStartDate?: string | null;
  harvestEndDate?: string | null;
  warnings: Warning[];
  notes?: string | null;
  yieldKg?: number | null;
  yieldQualityRating?: number | null;
  yieldNotes?: string | null;
  harvestResults?: HarvestResultRecord[];
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePlantingDto = {
  bedId: string;
  vegetableId: string;
  startMethod: PlantingStartMethod;
  sowedAt?: string | null;
  plannedStartDate: string;
  actualStartDate?: string | null;
  status?: PlantingStatus;
  notes?: string | null;
};

export type UpdatePlantingDto = Partial<Omit<CreatePlantingDto, "bedId">>;

export type PlantingMutationResponse = {
  planting: Planting;
  warnings: Warning[];
};
