import { TaskItem } from "@/src/api/queries/users/meTypes";

export type TaskOwnerScopeType = "user" | "bed" | "planting" | "growing_space";

export type TaskRelationType =
  | "direct"
  | "bed"
  | "space"
  | "related_from_bed"
  | "related_from_space"
  | null;

export type TaskBadgeContext =
  | "planting"
  | "bed"
  | "space"
  | "related"
  | "user";

export type OwnershipTaskLike = {
  ownerScopeType?: string | null;
  ownerScopeId?: string | null;
  relationType?: string | null;
  affectedPlantingIds?: string[] | null;
  targetType?: string | null;
  plantingId?: string | null;
  bedId?: string | null;
  growingSpaceId?: string | null;
  meta?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
} & Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readString(item))
    .filter((item): item is string => Boolean(item));
};

const getTaskString = (task: OwnershipTaskLike, ...keys: string[]) => {
  const containers = [
    task,
    asRecord(task.meta),
    asRecord(task.metadata),
    asRecord(task.context),
    asRecord(task.details),
    asRecord(task.payload),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  for (const container of containers) {
    for (const key of keys) {
      const value = readString(container[key]);
      if (value) return value;
    }
  }

  return null;
};

export const getTaskAffectedPlantingIds = (
  task: OwnershipTaskLike,
): string[] => {
  const direct = readArray(task.affectedPlantingIds);
  if (direct.length > 0) return direct;

  const fromMeta = readArray(task.meta?.affectedPlantingIds);
  if (fromMeta.length > 0) return fromMeta;

  const fromMetadata = readArray(task.metadata?.affectedPlantingIds);
  if (fromMetadata.length > 0) return fromMetadata;

  const fallback = [
    ...readArray((task as Record<string, unknown>).affected_planting_ids),
  ];
  return fallback;
};

const normalizeScope = (raw: string | null): TaskOwnerScopeType | null => {
  const normalized = raw?.trim().toUpperCase();
  if (normalized === "PLANTING") return "planting";
  if (normalized === "BED") return "bed";
  if (normalized === "SPACE" || normalized === "GROWING_SPACE") {
    return "growing_space";
  }
  if (normalized === "USER") return "user";
  return null;
};

const normalizeRelation = (
  raw: string | null,
  ownerScope: TaskOwnerScopeType,
): TaskRelationType => {
  const normalized = raw?.trim().toUpperCase();

  if (normalized === "DIRECT") return "direct";
  if (normalized === "BED") return "bed";
  if (normalized === "SPACE") return "space";
  if (normalized === "RELATED_FROM_BED") return "related_from_bed";
  if (normalized === "RELATED_FROM_SPACE") return "related_from_space";

  // LEGACY FALLBACK: backend transitional values
  if (normalized === "RELATED" || normalized === "AGGREGATED") {
    if (ownerScope === "bed") return "related_from_bed";
    if (ownerScope === "growing_space") return "related_from_space";
    return "direct";
  }

  // LEGACY FALLBACK: infer relation from ownership scope only
  if (ownerScope === "planting") return "direct";
  if (ownerScope === "bed") return "bed";
  if (ownerScope === "growing_space") return "space";
  return null;
};

export const getTaskOwnerScope = (
  task: OwnershipTaskLike,
): TaskOwnerScopeType => {
  const explicit = normalizeScope(
    getTaskString(task, "ownerScopeType", "owner_scope_type"),
  );
  if (explicit) return explicit;

  // LEGACY FALLBACK
  const legacy = normalizeScope(
    getTaskString(task, "targetType", "target_type", "scope"),
  );
  if (legacy) return legacy;
  if (task.growingSpaceId) return "growing_space";
  if (task.plantingId) return "planting";
  if (task.bedId) return "bed";
  return "user";
};

export const getTaskOwnerId = (task: OwnershipTaskLike): string | null => {
  const explicit = getTaskString(task, "ownerScopeId", "owner_scope_id");
  if (explicit) return explicit;

  // LEGACY FALLBACK
  const scope = getTaskOwnerScope(task);
  if (scope === "planting") {
    return getTaskString(task, "plantingId", "planting_id");
  }
  if (scope === "bed") {
    return getTaskString(task, "bedId", "bed_id");
  }
  if (scope === "growing_space") {
    return getTaskString(
      task,
      "growingSpaceId",
      "growing_space_id",
      "spaceId",
      "space_id",
    );
  }
  return null;
};

export const getTaskRelationType = (
  task: OwnershipTaskLike,
): TaskRelationType => {
  const scope = getTaskOwnerScope(task);
  return normalizeRelation(
    getTaskString(task, "relationType", "relation_type"),
    scope,
  );
};

export const isDirectPlantingTask = (task: OwnershipTaskLike) => {
  return (
    getTaskOwnerScope(task) === "planting" &&
    getTaskRelationType(task) === "direct"
  );
};

export const isBedTask = (task: OwnershipTaskLike) => {
  const relation = getTaskRelationType(task);
  return relation === "bed" || relation === "related_from_bed";
};

export const isSpaceTask = (task: OwnershipTaskLike) => {
  const relation = getTaskRelationType(task);
  return relation === "space" || relation === "related_from_space";
};

export const isTaskRelatedToPlanting = (
  task: OwnershipTaskLike,
  plantingId: string | null | undefined,
) => {
  if (!plantingId) return false;

  if (isDirectPlantingTask(task)) {
    return getTaskOwnerId(task) === plantingId;
  }

  return getTaskAffectedPlantingIds(task).includes(plantingId);
};

export const getTaskBadgeContext = (
  task: OwnershipTaskLike,
): TaskBadgeContext => {
  const relation = getTaskRelationType(task);
  if (relation === "related_from_bed" || relation === "related_from_space") {
    return "related";
  }
  if (relation === "bed") return "bed";
  if (relation === "space") return "space";
  if (relation === "direct") return "planting";

  const scope = getTaskOwnerScope(task);
  if (scope === "planting") return "planting";
  if (scope === "bed") return "bed";
  if (scope === "growing_space") return "space";
  return "user";
};

export const getTaskPresentationType = (task: OwnershipTaskLike) => {
  const relation = getTaskRelationType(task);
  if (relation === "direct") return "direct_planting" as const;
  if (relation === "bed") return "bed" as const;
  if (relation === "space") return "space" as const;
  if (relation === "related_from_bed") return "related_from_bed" as const;
  if (relation === "related_from_space") return "related_from_space" as const;

  const scope = getTaskOwnerScope(task);
  if (scope === "planting") return "direct_planting" as const;
  if (scope === "bed") return "bed" as const;
  if (scope === "growing_space") return "space" as const;
  return "user" as const;
};

export const toTaskItemLike = (task: OwnershipTaskLike): TaskItem =>
  task as TaskItem;
