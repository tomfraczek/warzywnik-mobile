import { TaskListStatusFilter } from "./types";

type ActionTaskRangeParams = {
  from?: string;
  to?: string;
};

export type PlantingTaskMode = "direct" | "related" | "all";

export const actionTaskKeys = {
  all: ["action-tasks"] as const,
  bed: (
    bedId: string,
    status?: TaskListStatusFilter,
    range?: ActionTaskRangeParams,
    scope?: "own" | "includingChildren",
  ) => ["action-tasks", "bed", bedId, { status, ...range, scope }] as const,
  planting: (
    plantingId: string,
    status?: TaskListStatusFilter,
    range?: ActionTaskRangeParams,
    mode?: PlantingTaskMode,
  ) =>
    [
      "action-tasks",
      "planting",
      plantingId,
      { status, ...range, mode },
    ] as const,
  detail: (id: string) => ["action-tasks", "detail", id] as const,
};
