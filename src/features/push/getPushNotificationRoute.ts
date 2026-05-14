import { Href } from "expo-router";
import { PushNotificationPayload } from "./types";

const homeRoute = (): Href => "/(tabs)/home";

export const getPushNotificationRoute = (
  payload: PushNotificationPayload,
): Href => {
  switch (payload.routeTarget) {
    case "HOME":
      return homeRoute();

    case "BEDS_LIST":
      return "/(tabs)/beds";

    case "BED_DETAIL": {
      if (!payload.bedId) {
        return "/(tabs)/beds";
      }
      return {
        pathname: "/(tabs)/beds/[bedId]",
        params: {
          bedId: payload.bedId,
        },
      };
    }

    case "PLANTING_DETAIL": {
      if (!payload.plantingId) {
        return "/(tabs)/planner";
      }
      if (payload.bedId) {
        return {
          pathname: "/(tabs)/beds/[bedId]/plantings/[plantingId]",
          params: {
            bedId: payload.bedId,
            plantingId: payload.plantingId,
          },
        };
      }
      return {
        pathname: "/plantings/[plantingId]",
        params: {
          plantingId: payload.plantingId,
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
          code: payload.warningCode ?? "",
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
      return "/(tabs)/profile/notifications";

    default:
      return homeRoute();
  }
};
