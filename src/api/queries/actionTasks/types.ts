export type ActionTaskStatus = "pending" | "done";

export type TaskListStatusFilter = "pending" | "done" | "all";

export type TaskEntityStatusLike = ActionTaskStatus | "canceled";

export type ActionTask = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  status: ActionTaskStatus;
  bedId?: string | null;
  plantingId?: string | null;
  actionTemplateId?: string | null;
  isManuallyRescheduled?: boolean;
};

export type ActionTaskListResponse = {
  items: ActionTask[];
};

export type UpdateActionTaskDto = {
  status?: ActionTaskStatus;
  dueAt?: string;
};

export const resolveActionTaskList = (payload: unknown): ActionTask[] => {
  if (Array.isArray(payload)) {
    return payload as ActionTask[];
  }

  if (typeof payload === "object" && payload !== null) {
    const response = payload as { items?: unknown; data?: unknown };
    if (Array.isArray(response.items)) {
      return response.items as ActionTask[];
    }
    if (Array.isArray(response.data)) {
      return response.data as ActionTask[];
    }
  }

  return [];
};

export const mapEntityStatusToTaskListFilter = (
  status: TaskEntityStatusLike,
): TaskListStatusFilter => {
  if (status === "pending") return "pending";
  if (status === "done") return "done";
  return "all";
};

export const normalizeTaskListStatusFilter = (
  status?: TaskListStatusFilter | TaskEntityStatusLike | "planned",
): TaskListStatusFilter | undefined => {
  if (!status) return undefined;
  if (status === "pending" || status === "done" || status === "all") {
    return status;
  }
  if (status === "planned") return "pending";
  return mapEntityStatusToTaskListFilter(status);
};
