import {
  OwnershipTaskLike,
  getTaskAffectedPlantingIds,
  getTaskOwnerId,
  getTaskOwnerScope,
  getTaskRelationType,
} from "./taskOwnership";

export type TaskNavigationTarget =
  | { type: "planting"; plantingId: string; bedId?: string | null }
  | { type: "bed"; bedId: string }
  | { type: "space"; spaceId?: string | null }
  | null;

export const getTaskNavigationTarget = (
  task: OwnershipTaskLike,
): TaskNavigationTarget => {
  const scope = getTaskOwnerScope(task);
  const ownerId = getTaskOwnerId(task);
  const relation = getTaskRelationType(task);

  if (relation === "direct" && scope === "planting") {
    const plantingId = ownerId ?? task.plantingId ?? null;
    if (!plantingId) return null;
    return {
      type: "planting",
      plantingId,
      bedId: task.bedId ?? null,
    };
  }

  if (relation === "bed" && scope === "bed") {
    const bedId = ownerId ?? task.bedId ?? null;
    if (!bedId) return null;
    return { type: "bed", bedId };
  }

  if (relation === "space" && scope === "growing_space") {
    return {
      type: "space",
      spaceId: ownerId ?? task.growingSpaceId ?? null,
    };
  }

  if (relation === "related_from_bed") {
    const bedId = ownerId ?? task.bedId ?? null;
    if (!bedId) return null;
    return { type: "bed", bedId };
  }

  if (relation === "related_from_space") {
    return {
      type: "space",
      spaceId: ownerId ?? task.growingSpaceId ?? null,
    };
  }

  // LEGACY FALLBACK
  if (task.plantingId) {
    return {
      type: "planting",
      plantingId: task.plantingId,
      bedId: task.bedId ?? null,
    };
  }

  if (task.bedId) {
    return {
      type: "bed",
      bedId: task.bedId,
    };
  }

  if (task.growingSpaceId) {
    return {
      type: "space",
      spaceId: task.growingSpaceId,
    };
  }

  const firstAffectedPlanting = getTaskAffectedPlantingIds(task)[0];
  if (firstAffectedPlanting) {
    return {
      type: "planting",
      plantingId: firstAffectedPlanting,
      bedId: task.bedId ?? null,
    };
  }

  return null;
};
