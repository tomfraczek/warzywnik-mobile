import { restClient } from "@/src/api/axios";
import { Router } from "expo-router";
import { getPushNotificationRoute } from "./getPushNotificationRoute";
import { parsePushNotificationPayload } from "./parsePushNotificationPayload";

const markNotificationOpened = async (notificationId: string) => {
  try {
    await restClient.patch(`/v1/notifications/${notificationId}/opened`);
  } catch (error) {
    console.warn("Failed to mark notification opened", error);
  }
};

export const handlePushNotificationResponse = async (
  router: Router,
  rawPayload: unknown,
) => {
  const parsed = parsePushNotificationPayload(rawPayload);

  if (!parsed.isValid || !parsed.payload) {
    console.warn("Invalid push payload", parsed.reason);
    router.push("/(tabs)/home");
    return;
  }

  const route = getPushNotificationRoute(parsed.payload);
  await markNotificationOpened(parsed.payload.notificationId);
  router.push(route);
};
