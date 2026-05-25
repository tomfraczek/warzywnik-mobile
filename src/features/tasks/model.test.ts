import { describe, expect, it } from "bun:test";
import {
  getTaskNavigationTarget,
  getTaskOwnerId,
  getTaskOwnerScope,
  getTaskRelationType,
  isTaskRelatedToPlanting,
} from "./model";

describe("task ownership helpers", () => {
  it("prefers ownerScope fields over legacy targetType", () => {
    const task = {
      id: "t1",
      status: "pending",
      ownerScopeType: "PLANTING",
      ownerScopeId: "p-1",
      targetType: "BED",
      bedId: "b-legacy",
    };

    expect(getTaskOwnerScope(task)).toBe("planting");
    expect(getTaskOwnerId(task)).toBe("p-1");
  });

  it("falls back to legacy ids when ownerScope is missing", () => {
    const task = {
      id: "t2",
      status: "pending",
      targetType: "BED",
      bedId: "b-1",
    };

    expect(getTaskOwnerScope(task)).toBe("bed");
    expect(getTaskOwnerId(task)).toBe("b-1");
  });

  it("resolves relation with fallback to affected planting ids", () => {
    const task = {
      id: "t3",
      status: "pending",
      ownerScopeType: "BED",
      ownerScopeId: "b-1",
      meta: {
        affectedPlantingIds: ["p-1", "p-2"],
      },
    };

    expect(getTaskRelationType(task)).toBe("related");
    expect(isTaskRelatedToPlanting(task, "p-1")).toBe(true);
    expect(isTaskRelatedToPlanting(task, "p-9")).toBe(false);
  });

  it("builds planting route target from ownership scope", () => {
    const task = {
      id: "t4",
      status: "pending",
      ownerScopeType: "PLANTING",
      ownerScopeId: "p-11",
      bedId: "b-11",
    };

    expect(getTaskNavigationTarget(task)).toEqual({
      type: "planting",
      plantingId: "p-11",
      bedId: "b-11",
    });
  });

  it("keeps bed navigation for bed-scoped task", () => {
    const task = {
      id: "t5",
      status: "pending",
      ownerScopeType: "BED",
      ownerScopeId: "b-2",
      meta: {
        affectedPlantingIds: ["p-21"],
      },
    };

    expect(getTaskNavigationTarget(task)).toEqual({
      type: "bed",
      bedId: "b-2",
    });
  });
});
