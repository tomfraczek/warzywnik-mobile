import { describe, expect, it } from "vitest";
import {
  getTaskOwnershipLabel,
  getTaskOwnershipReason,
} from "./taskPresentation";

describe("task ownership presentation", () => {
  it("returns direct planting label", () => {
    const task = {
      ownerScopeType: "PLANTING",
      ownerScopeId: "p-1",
      relationType: "DIRECT",
    };
    expect(getTaskOwnershipLabel(task)).toBe("Zadanie uprawy");
  });

  it("returns related_from_bed label and reason", () => {
    const task = {
      ownerScopeType: "BED",
      ownerScopeId: "b-1",
      relationType: "RELATED_FROM_BED",
    };
    expect(getTaskOwnershipLabel(task)).toBe(
      "Dotyczy tej uprawy przez grządkę",
    );
    expect(getTaskOwnershipReason(task)).toContain("grządki");
  });
});
