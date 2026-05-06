export type BedQuickActionKind =
  | "WATERING"
  | "WEEDING"
  | "MOISTURE_CHECK"
  | "NOTE";

export type PlantingQuickActionKind = "HARVEST" | "NOTE";

export type MoistureLevel = "dry" | "ok" | "wet";

export type HarvestUnit = "g" | "kg" | "pcs" | "bunch";

export type PostBedQuickActionDto = {
  actionKind: BedQuickActionKind;
  occurredAt?: string;
  note?: string;
  moistureLevel?: MoistureLevel;
};

export type PostPlantingQuickActionDto = {
  actionKind: PlantingQuickActionKind;
  occurredAt?: string;
  note?: string;
  amount?: number;
  unit?: HarvestUnit;
};
