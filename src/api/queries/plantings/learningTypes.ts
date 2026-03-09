export type PlantingEventType =
  | "PLANTING_CREATED"
  | "PLANTING_SOWED"
  | "PLANTING_TRANSPLANTED"
  | "PLANTING_STARTED"
  | "PLANTING_STATUS_CHANGED"
  | "PLANTING_CANCELLED"
  | "PLANTING_HARVEST_STARTED"
  | "PLANTING_HARVEST_FINISHED"
  | "PLANTING_ACTION_COMPLETED";

export type PlantingEventItem = {
  time: string;
  type: "PLANTING_EVENT";
  eventType: PlantingEventType;
  payload: Record<string, unknown>;
};

export type ActionCompletedItem = {
  time: string;
  type: "ACTION_COMPLETED";
  taskId: string;
  title: string;
  actionType: string | null;
  source: string;
};

export type PestOccurrenceItem = {
  time: string;
  type: "PEST_OCCURRENCE";
  occurrenceId: string;
  pestId: string;
  pestName: string;
  status: string;
  notes: string | null;
};

export type DiseaseOccurrenceItem = {
  time: string;
  type: "DISEASE_OCCURRENCE";
  occurrenceId: string;
  diseaseId: string;
  diseaseName: string;
  severity: string | null;
  status: string;
  notes: string | null;
};

export type TimelineItem =
  | PlantingEventItem
  | ActionCompletedItem
  | PestOccurrenceItem
  | DiseaseOccurrenceItem;

export type PlantingTimeline = {
  plantingId: string;
  items: TimelineItem[];
};

export type SeasonSummary = {
  id: string;
  plantingId: string;
  userId: string;
  bedId: string;
  vegetableId: string;
  seasonYear: number;
  realStartDate: string | null;
  realEndDate: string | null;
  seasonDurationDays: number | null;
  tasksCompleted: number;
  wateringCount: number;
  fertilizationCount: number;
  protectionCount: number;
  pestEvents: number;
  diseaseEvents: number;
  yieldKg: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PreviousSeasonSummary = SeasonSummary & {
  startDiffDays: number | null;
  durationDiffDays: number | null;
  yieldDiffKg: number | null;
  taskCountDiff: number | null;
};

export type PlantingSeasonComparison = {
  current: SeasonSummary | null;
  previous: PreviousSeasonSummary[];
};

export type BedSeasonsResponse = {
  items: SeasonSummary[];
};

export type UpdateHarvestResultDto = {
  yieldKg?: number | null;
  qualityRating?: number | null;
  notes?: string | null;
};

export type CreateHarvestResultRecordDto = {
  harvestedAt?: string | null;
  yieldKg?: number | null;
  qualityRating?: number | null;
  notes?: string | null;
};
