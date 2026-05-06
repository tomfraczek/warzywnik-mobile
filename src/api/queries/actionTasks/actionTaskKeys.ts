import { TaskListStatusFilter } from "./types";

type ActionTaskRangeParams = {
  from?: string;
  to?: string;
};

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
  ) => ["action-tasks", "planting", plantingId, { status, ...range }] as const,
  detail: (id: string) => ["action-tasks", "detail", id] as const,
};
