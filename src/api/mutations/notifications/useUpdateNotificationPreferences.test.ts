import { describe, expect, it } from "vitest";
import { NotificationPreferences } from "../../queries/notifications/types";
import {
  mergeOptimisticPreferences,
  normalizeUpdatePayload,
} from "./useUpdateNotificationPreferences";

const basePreferences = (): NotificationPreferences => ({
  notificationsEnabled: true,
  notificationHour: 8,
  ui: {},
  advanced: {
    dailySummaryEnabled: true,
    lifecycleSuggestionsEnabled: true,
    weatherAlertsEnabled: true,
    gardenRiskEnabled: true,
    weatherStatusEnabled: true,
    recommendedArticlesEnabled: true,
    weeklyDigestEnabled: true,
  },
});

describe("normalizeUpdatePayload", () => {
  it("sets dailySummaryEnabled=false in request payload", () => {
    const payload = normalizeUpdatePayload({
      advanced: { dailySummaryEnabled: false },
    });

    expect(payload).toEqual({
      advanced: { dailySummaryEnabled: false },
    });
  });

  it("sets lifecycleSuggestionsEnabled=false in request payload", () => {
    const payload = normalizeUpdatePayload({
      advanced: { lifecycleSuggestionsEnabled: false },
    });

    expect(payload).toEqual({
      advanced: { lifecycleSuggestionsEnabled: false },
    });
  });

  it("sets recommendedArticlesEnabled=false in request payload", () => {
    const payload = normalizeUpdatePayload({
      advanced: { recommendedArticlesEnabled: false },
    });

    expect(payload).toEqual({
      advanced: { recommendedArticlesEnabled: false },
    });
  });

  it("sets weatherAlertsEnabled=false in request payload", () => {
    const payload = normalizeUpdatePayload({
      advanced: { weatherAlertsEnabled: false },
    });

    expect(payload).toEqual({
      advanced: { weatherAlertsEnabled: false },
    });
  });

  it("does not forward deprecated groups/tasksAndRemindersEnabled", () => {
    const payload = normalizeUpdatePayload({
      advanced: { weeklyDigestEnabled: false },
      // legacy/deprecated keys passed via any should be ignored
      ...({
        groups: { tasksAndRemindersEnabled: false },
      } as any),
    });

    expect(payload).toEqual({
      advanced: { weeklyDigestEnabled: false },
    });
  });

  it("does not send intensity", () => {
    const payload = normalizeUpdatePayload({
      advanced: { gardenRiskEnabled: false },
      ...({ intensity: "ALL" } as any),
    });

    expect(payload).toEqual({
      advanced: { gardenRiskEnabled: false },
    });
  });
});

describe("mergeOptimisticPreferences", () => {
  it("updates granular advanced flag optimistically", () => {
    const next = mergeOptimisticPreferences(basePreferences(), {
      advanced: { dailySummaryEnabled: false },
    });

    expect(next.advanced.dailySummaryEnabled).toBe(false);
    expect(next.advanced.lifecycleSuggestionsEnabled).toBe(true);
  });
});
