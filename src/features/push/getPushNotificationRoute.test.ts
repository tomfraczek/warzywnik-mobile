import { describe, expect, it } from "vitest";
import { getPushNotificationRoute } from "./getPushNotificationRoute";
import { parsePushNotificationPayload } from "./parsePushNotificationPayload";
import { PushNotificationPayload } from "./types";

const basePayload = (): PushNotificationPayload => ({
  notificationId: "n1",
  type: "TASKS_GENERATED",
  routeTarget: "PLANNER",
  priority: "NORMAL",
  title: "Test",
  body: "Body",
  dedupeKey: "d1",
  createdAt: new Date().toISOString(),
});

// ── Legacy tests (must remain passing) ──────────────────────────────────────

describe("push routing ownership-aware", () => {
  it("routes direct planting push to planting detail", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANTING_DETAIL",
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
      ...basePayload(),
      routeTarget: "PLANTING_DETAIL",
      priority: "HIGH",
      dedupeKey: "d2",
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

// ── Scenario G: old single BED_DETAIL + bedId ───────────────────────────────

describe("scenario G – single BED_DETAIL backward compat", () => {
  it("routes to bed detail when no userIntentKey", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "BED_DETAIL",
      bedId: "b-1",
    });

    expect(route).toEqual({
      pathname: "/(tabs)/beds/[bedId]",
      params: { bedId: "b-1" },
    });
  });
});

// ── Scenario H: old single PLANTING_DETAIL + plantingId ─────────────────────

describe("scenario H – single PLANTING_DETAIL backward compat", () => {
  it("routes to planting detail when no userIntentKey", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANTING_DETAIL",
      plantingId: "p-1",
      bedId: "b-1",
    });

    expect(route).toEqual({
      pathname: "/(tabs)/beds/[bedId]/plantings/[plantingId]",
      params: { bedId: "b-1", plantingId: "p-1" },
    });
  });
});

// ── Scenario A: WATERING_TODAY aggregated ───────────────────────────────────

describe("scenario A – WATERING_TODAY aggregated", () => {
  it("routes to planner/tasks, NOT to bed detail", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "BED_DETAIL",
      userIntentKey: "WATERING_TODAY",
      bedIds: ["b-1", "b-2", "b-3"],
      bedId: "b-1", // compat field — must be ignored
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });

  it("also handles userIntentKey variants like WATERING_TODAY:BED", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "BED_DETAIL",
      userIntentKey: "WATERING_TODAY:BED",
      bedIds: ["b-1"],
      bedId: "b-1",
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });
});

// ── Scenario B: HARVEST_READY aggregated ────────────────────────────────────

describe("scenario B – HARVEST_READY aggregated", () => {
  it("routes to planner/tasks, NOT to planting detail", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANTING_DETAIL",
      userIntentKey: "HARVEST_READY",
      plantingIds: ["p-1", "p-2", "p-3"],
      plantingId: "p-1", // compat field — must be ignored
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });
});

// ── Scenario C: LIFECYCLE_HARVEST_WINDOW_START ──────────────────────────────

describe("scenario C – LIFECYCLE_HARVEST_WINDOW_START", () => {
  it("routes to planner/tasks", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANTING_DETAIL",
      userIntentKey: "LIFECYCLE_HARVEST_WINDOW_START",
      plantingIds: ["p-1", "p-2"],
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });
});

// ── Scenario D: WEATHER_ALERTS:DROUGHT ──────────────────────────────────────

describe("scenario D – WEATHER_ALERTS:DROUGHT", () => {
  it("routes to home/warnings", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "WEATHER_ALERTS",
      userIntentKey: "WEATHER_ALERTS:DROUGHT",
    });

    expect(route).toBe("/(tabs)/home/warnings");
  });
});

// ── Scenario E: GARDEN_RISK_DROUGHT ─────────────────────────────────────────

describe("scenario E – GARDEN_RISK_DROUGHT", () => {
  it("routes to home/garden-risk", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "GARDEN_RISK",
      userIntentKey: "GARDEN_RISK_DROUGHT",
    });

    expect(route).toBe("/(tabs)/home/garden-risk");
  });
});

// ── Scenario F: FROST_PROTECTION / WIND_PROTECTION ──────────────────────────

describe("scenario F – FROST_PROTECTION and WIND_PROTECTION", () => {
  it("FROST_PROTECTION routes to planner/tasks", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANNER_TASKS",
      userIntentKey: "FROST_PROTECTION",
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });

  it("WIND_PROTECTION routes to planner/tasks", () => {
    const route = getPushNotificationRoute({
      ...basePayload(),
      routeTarget: "PLANNER_TASKS",
      userIntentKey: "WIND_PROTECTION",
    });

    expect(route).toBe("/(tabs)/planner/tasks");
  });
});

// ── Scenario I: parser with new aggregated fields ───────────────────────────

describe("scenario I – parser handles aggregated payload", () => {
  it("parses userIntentKey, count, deliveryPolicy correctly", () => {
    const raw = {
      notificationId: "n-agg-1",
      type: "TASKS_GENERATED",
      routeTarget: "PLANNER_TASKS",
      priority: "HIGH",
      title: "Podlewanie roślin",
      body: "3 grządki wymagają uwagi",
      dedupeKey: "dk-1",
      createdAt: new Date().toISOString(),
      userIntentKey: "WATERING_TODAY",
      count: 3,
      deliveryPolicy: "PUSH_IMMEDIATE",
      bedIds: ["b-1", "b-2", "b-3"],
      bedId: "b-1",
    };

    const result = parsePushNotificationPayload(raw);

    expect(result.isValid).toBe(true);
    expect(result.payload?.userIntentKey).toBe("WATERING_TODAY");
    expect(result.payload?.count).toBe(3);
    expect(result.payload?.deliveryPolicy).toBe("PUSH_IMMEDIATE");
    expect(result.payload?.bedIds).toEqual(["b-1", "b-2", "b-3"]);
    expect(result.payload?.bedId).toBe("b-1");
  });
});

// ── Scenario J: parser with old payload without new fields ──────────────────

describe("scenario J – parser handles legacy payload without new fields", () => {
  it("old payload without userIntentKey/count/deliveryPolicy is still valid", () => {
    const raw = {
      notificationId: "n-old-1",
      type: "TASKS_GENERATED",
      routeTarget: "BED_DETAIL",
      priority: "NORMAL",
      title: "Grządka wymaga uwagi",
      body: "Sprawdź grządkę",
      dedupeKey: "dk-old-1",
      createdAt: new Date().toISOString(),
      bedId: "b-1",
    };

    const result = parsePushNotificationPayload(raw);

    expect(result.isValid).toBe(true);
    expect(result.payload?.userIntentKey).toBeUndefined();
    expect(result.payload?.count).toBeUndefined();
    expect(result.payload?.deliveryPolicy).toBeUndefined();
    expect(result.payload?.bedId).toBe("b-1");
  });
});
