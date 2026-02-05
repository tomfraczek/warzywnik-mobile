export type PlantingStatus =
  | "PLANNED"
  | "ACTIVE"
  | "HARVESTING"
  | "FINISHED"
  | "CANCELLED";

export type WarningSeverity = "INFO" | "WARNING" | "ERROR";

export type Warning = {
  code: string;
  severity: WarningSeverity;
  title: string;
  message: string;
  hint?: string | null;
};

export type PlantingVegetable = {
  id: string;
  name: string;
};

export type Planting = {
  id: string;
  bedId: string;
  vegetableId: string;
  vegetable?: PlantingVegetable | null;
  vegetableName?: string | null;
  status: PlantingStatus;
  plannedStartDate: string;
  actualStartDate?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePlantingDto = {
  bedId: string;
  vegetableId: string;
  plannedStartDate: string;
  actualStartDate?: string | null;
  status?: PlantingStatus;
  notes?: string | null;
};

export type UpdatePlantingDto = Partial<Omit<CreatePlantingDto, "bedId">>;

export type PlantingMutationResponse = {
  planting: Planting;
  warnings?: Warning[] | null;
};
