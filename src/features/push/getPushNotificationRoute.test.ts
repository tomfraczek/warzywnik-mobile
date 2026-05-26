import { describe, expect, it } from "bun:test";
import { getPushNotificationRoute } from "./getPushNotificationRoute";

describe("push routing ownership-aware", () => {
  it("routes direct planting push to planting detail", () => {
    const route = getPushNotificationRoute({
      notificationId: "n1",
      type: "TASKS_GENERATED",
      routeTarget: "PLANTING_DETAIL",
      priority: "NORMAL",
      title: "t",
      body: "b",
      dedupeKey: "d",
      createdAt: new Date().toISOString(),
      ownerScopeType: "PLANTING",
      ownerScopeId: "p-1",
      relationType: "DIRECT",
    });

    expect(route).toEqual({
      pathname: "/plantings/[plantingId]",
      params: { plantingId: "p-1" },
    });
  });

  it("routes related_from_bed push to bed detail", () => {
    const route = getPushNotificationRoute({
      notificationId: "n2",
      type: "TASKS_GENERATED",
      routeTarget: "PLANTING_DETAIL",
      priority: "HIGH",
      title: "t",
      body: "b",
      dedupeKey: "d2",
      createdAt: new Date().toISOString(),
      ownerScopeType: "BED",
      ownerScopeId: "b-7",
      relationType: "RELATED_FROM_BED",
    });

    expect(route).toEqual({
      pathname: "/(tabs)/beds/[bedId]",
      params: { bedId: "b-7" },
    });
  });
});
