import { TaskListStatusFilter } from "./types";

export const actionTaskKeys = {
  all: ["action-tasks"] as const,
  bed: (bedId: string, status?: TaskListStatusFilter) =>
    ["action-tasks", "bed", bedId, { status }] as const,
  planting: (plantingId: string, status?: TaskListStatusFilter) =>
    ["action-tasks", "planting", plantingId, { status }] as const,
  detail: (id: string) => ["action-tasks", "detail", id] as const,
};
