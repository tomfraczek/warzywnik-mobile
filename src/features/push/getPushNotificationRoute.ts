import { Href } from "expo-router";
import { PushNotificationPayload } from "./types";

const homeRoute = (): Href => "/(tabs)/home";

/**
 * Routing based on userIntentKey takes priority over routeTarget.
 *
 * Aggregated notifications must never fall through to single bedId/plantingId
 * routing just because the backend still provides those fields for backward
 * compatibility.
 *
 * Pattern matching uses prefix matching so that variants like
 * "WATERING_TODAY:BED" or "GARDEN_RISK_DROUGHT" are handled correctly.
 */
const getRouteByUserIntentKey = (userIntentKey: string): Href | null => {
  // Task / planner intents → planner tasks list
  if (
    userIntentKey.startsWith("WATERING_TODAY") ||
    userIntentKey.startsWith("HARVEST_READY") ||
    userIntentKey.startsWith("LIFECYCLE_HARVEST") ||
    userIntentKey.startsWith("FROST_PROTECTION") ||
    userIntentKey.startsWith("WIND_PROTECTION")
  ) {
    return "/(tabs)/planner/tasks";
  }

  // Planner / today plan intents → planner root
  if (userIntentKey.startsWith("TASKS_DUE_TODAY")) {
    return "/(tabs)/planner";
  }

  // Weather alert intents
  if (userIntentKey.startsWith("WEATHER_ALERTS")) {
    return "/(tabs)/home/warnings";
  }

  // Garden risk intents (GARDEN_RISK_DROUGHT, GARDEN_RISK_FLOOD, etc.)
  if (userIntentKey.startsWith("GARDEN_RISK")) {
    return "/(tabs)/home/garden-risk";
  }

  return null;
};

const resolvePayloadBedId = (payload: PushNotificationPayload) => {
  if (payload.bedId) return payload.bedId;
  if (payload.ownerScopeType === "BED" && payload.ownerScopeId) {
    return payload.ownerScopeId;
  }
  return undefined;
};

const resolvePayloadSpaceId = (payload: PushNotificationPayload) => {
  if (payload.growingSpaceId) return payload.growingSpaceId;
  if (
    (payload.ownerScopeType === "GROWING_SPACE" ||
      payload.ownerScopeType === "SPACE") &&
    payload.ownerScopeId
  ) {
    return payload.ownerScopeId;
  }
  return undefined;
};

const resolvePayloadPlantingId = (payload: PushNotificationPayload) => {
  if (payload.plantingId) return payload.plantingId;
  if (payload.ownerScopeType === "PLANTING" && payload.ownerScopeId) {
    return payload.ownerScopeId;
  }
  return payload.affectedPlantingIds?.[0];
};

export const getPushNotificationRoute = (
  payload: PushNotificationPayload,
): Href => {
  // ── 1. userIntentKey routing (aggregated notifications) ──────────────────
  // This MUST run before routeTarget resolution to prevent aggregated pushes
  // from landing on a single bed/planting detail screen.
  if (payload.userIntentKey) {
    const intentRoute = getRouteByUserIntentKey(payload.userIntentKey);
    if (intentRoute !== null) {
      return intentRoute;
    }
  }

  // ── 2. Legacy routeTarget routing ────────────────────────────────────────
  switch (payload.routeTarget) {
    case "HOME":
      return homeRoute();

    case "BEDS_LIST":
      return "/(tabs)/beds";

    case "BED_DETAIL": {
      const bedId = resolvePayloadBedId(payload);
      if (!bedId) {
        return "/(tabs)/beds";
      }
      return {
        pathname: "/(tabs)/beds/[bedId]",
        params: {
          bedId,
        },
      };
    }

    case "PLANTING_DETAIL": {
      if (payload.relationType === "RELATED_FROM_BED") {
        const relatedBedId = resolvePayloadBedId(payload);
        if (relatedBedId) {
          return {
            pathname: "/(tabs)/beds/[bedId]",
            params: {
              bedId: relatedBedId,
            },
          };
        }
      }

      if (payload.relationType === "RELATED_FROM_SPACE") {
        const spaceId = resolvePayloadSpaceId(payload);
        if (spaceId) {
          return "/(tabs)/planner/tasks?filter=space";
        }
      }

      const plantingId = resolvePayloadPlantingId(payload);
      if (!plantingId) {
        return "/(tabs)/planner";
      }
      const bedId = resolvePayloadBedId(payload);
      if (bedId) {
        return {
          pathname: "/(tabs)/beds/[bedId]/plantings/[plantingId]",
          params: {
            bedId,
            plantingId,
          },
        };
      }
      return {
        pathname: "/plantings/[plantingId]",
        params: {
          plantingId,
        },
      };
    }

    case "PLANNER":
      return "/(tabs)/planner";

    case "PLANNER_TASKS":
      return "/(tabs)/planner/tasks";

    case "WEATHER":
      return "/(tabs)/home/weather";

    case "GARDEN_RISK":
      return "/(tabs)/home/garden-risk";

    case "WEATHER_ALERTS":
      return "/(tabs)/home/warnings";

    case "WEATHER_ALERT_DETAIL": {
      const warningId = payload.warningIds?.[0];
      if (!warningId && !payload.warningCode) {
        return "/(tabs)/home/warnings";
      }
      return {
        pathname: "/(tabs)/home/alert-details",
        params: {
          title: payload.title,
          message: payload.body,
          warningId: warningId ?? "",
        },
      };
    }

    case "ARTICLE_DETAIL": {
      if (payload.articleId) {
        return {
          pathname: "/(tabs)/education/articles/[id]",
          params: {
            id: payload.articleId,
          },
        };
      }
      if (payload.articleSlug) {
        return {
          pathname: "/(tabs)/education/[slug]",
          params: {
            slug: payload.articleSlug,
          },
        };
      }
      return "/(tabs)/education/articles";
    }

    case "ARTICLES_LIST":
      return "/(tabs)/education/articles";

    case "NOTIFICATION_CENTER":
      return "/notifications";

    default:
      return homeRoute();
  }
};
