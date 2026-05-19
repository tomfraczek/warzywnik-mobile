import { restClient } from "@/src/api/axios";
import { queryClient } from "@/src/api/queryClient";
import { Router } from "expo-router";
import { getPushNotificationRoute } from "./getPushNotificationRoute";
import { parsePushNotificationPayload } from "./parsePushNotificationPayload";

const markNotificationOpened = async (notificationId: string) => {
  try {
    await restClient.patch(`/notifications/${notificationId}/opened`);
  } catch (error) {
    console.warn("Failed to mark notification opened", error);
  }
};

const markNotificationRead = async (notificationId: string) => {
  try {
    await restClient.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.warn("Failed to mark notification read", error);
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
  await Promise.all([
    markNotificationOpened(parsed.payload.notificationId),
    markNotificationRead(parsed.payload.notificationId),
  ]);
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: ["notifications", "list"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications", "summary"] }),
  ]);
  router.push(route);
};
