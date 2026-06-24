export type BedQuickActionKind =
  | "WATERING"
  | "WEEDING"
  | "MOISTURE_CHECK"
  | "NOTE";

export type PlantingQuickActionKind = "NOTE";

export type MoistureLevel = "dry" | "ok" | "wet";

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
};

export type QuickActionNote = {
  id: string;
  note: string;
  occurredAt: string | null;
  createdAt?: string | null;
  scope?: "bed" | "planting" | null;
  accessStatus?: 'available' | 'locked';
};

export type QuickActionNotesResponse = {
  items: QuickActionNote[];
};
