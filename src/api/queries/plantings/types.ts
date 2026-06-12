export type PlantingStatus =
  | "NEW"
  | "IN_GROUND"
  | "READY_FOR_FINAL_HARVEST"
  | "HARVESTED"
  | "CLEARED"
  | "FAILED"
  | "CANCELLED";

export type PlantingStartMethod =
  | "DIRECT_SOW"
  | "TRANSPLANT"
  | "PURCHASED_SEEDLING";

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
  transplantedAt?: string | null;
  plannedStartDate?: string | null;
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
  /** Optional alias accepted by backend for planned start datetime (ISO). */
  date?: string | null;
  sowedAt?: string | null;
  transplantedAt?: string | null;
  plannedStartDate?: string | null;
  actualStartDate?: string | null;
  status?: PlantingStatus;
  notes?: string | null;
};

export type UpdatePlantingDto = Partial<Omit<CreatePlantingDto, "bedId">>;

export type PlantingAvailableStatusesResponse = {
  plantingId: string;
  currentStatus: PlantingStatus;
  startMethod: PlantingStartMethod;
  availableStatuses: PlantingStatus[];
};

export type PlantingMutationResponse = {
  planting: Planting;
  warnings: Warning[];
};
