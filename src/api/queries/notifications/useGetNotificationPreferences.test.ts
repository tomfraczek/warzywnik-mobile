import { describe, expect, it } from "vitest";
import { normalizePreferences } from "./useGetNotificationPreferences";

describe("normalizePreferences", () => {
  it("maps granular backend fields to advanced preferences", () => {
    const result = normalizePreferences({
      notificationsEnabled: true,
      dailySummaryEnabled: true,
      lifecycleSuggestionsEnabled: false,
      weatherAlertsEnabled: true,
      gardenRiskEnabled: false,
      weatherStatusEnabled: true,
      recommendedArticlesEnabled: false,
      weeklyDigestEnabled: true,
      notificationHour: 9,
    });

    expect(result.advanced.dailySummaryEnabled).toBe(true);
    expect(result.advanced.lifecycleSuggestionsEnabled).toBe(false);
    expect(result.advanced.weatherAlertsEnabled).toBe(true);
    expect(result.advanced.gardenRiskEnabled).toBe(false);
    expect(result.advanced.weatherStatusEnabled).toBe(true);
    expect(result.advanced.recommendedArticlesEnabled).toBe(false);
    expect(result.advanced.weeklyDigestEnabled).toBe(true);
  });

  it("does not expose deprecated groups or intensity in normalized output", () => {
    const result = normalizePreferences({
      notificationsEnabled: true,
      groups: {
        tasksAndRemindersEnabled: false,
      },
      intensity: "ALL",
    });

    expect("groups" in (result as any)).toBe(false);
    expect("intensity" in (result as any)).toBe(false);
  });
});
