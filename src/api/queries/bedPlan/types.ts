import {
  PlantingStartMethod,
  PlantingStatus,
} from "@/src/api/queries/plantings/types";

export type PlanChecklistStatus = "pending" | "done" | "skipped";

export type PlanChecklistSource = "auto" | "manual";

export type PlanChecklistScope = "bed" | "planting";

export type PlanChecklistPriority = "low" | "medium" | "high" | "critical";

export type PlanChecklistItem = {
  id: string;
  scope: PlanChecklistScope;
  source: PlanChecklistSource;
  status: PlanChecklistStatus;
  priority: PlanChecklistPriority;
  title: string;
  description?: string | null;
  reason?: string | null;
  bedId: string;
  plantingId?: string | null;
  vegetableId?: string | null;
  isUserModified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlannedPlanting = {
  id: string;
  vegetableId: string;
  vegetableName: string;
  vegetableSlug: string;
  plannedStartDate?: string | null;
  startMethod?: PlantingStartMethod;
  status: PlantingStatus;
};

export type BedPlanSummary = {
  total: number;
  pending: number;
  done: number;
  skipped: number;
};

export type BedPlanResponse = {
  bed: {
    id: string;
    name: string;
  };
  plannedPlantings: PlannedPlanting[];
  checklistItems: PlanChecklistItem[];
  summary: BedPlanSummary;
};

export type CreatePlanChecklistItemDto = {
  title: string;
  description?: string | null;
  priority?: PlanChecklistPriority;
  scope?: PlanChecklistScope;
  plantingId?: string | null;
};

export type UpdatePlanChecklistItemDto = {
  status?: PlanChecklistStatus;
  title?: string;
  description?: string | null;
  priority?: PlanChecklistPriority;
};
