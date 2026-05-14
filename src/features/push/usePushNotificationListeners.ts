import { handlePushNotificationResponse } from "@/src/features/push/handlePushNotificationResponse";
import { parsePushNotificationPayload } from "@/src/features/push/parsePushNotificationPayload";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

type ForegroundBanner = {
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
} | null;

type QueuedForegroundMessage = {
  title: string;
  body: string;
  payload: Record<string, unknown> | null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
};

export const usePushNotificationListeners = () => {
  const router = useRouter();
  const [banner, setBanner] = useState<ForegroundBanner>(null);
  const queueRef = useRef<QueuedForegroundMessage[]>([]);
  const isBannerVisibleRef = useRef(false);
  const lastHandledResponseIdRef = useRef<string | null>(null);

  const flushQueue = useCallback(() => {
    if (isBannerVisibleRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    isBannerVisibleRef.current = true;
    setBanner(next);
  }, []);

  const enqueueBanner = useCallback(
    (item: QueuedForegroundMessage) => {
      queueRef.current.push(item);
      flushQueue();
    },
    [flushQueue],
  );

  const dismissBanner = useCallback(() => {
    setBanner(null);
    isBannerVisibleRef.current = false;
    flushQueue();
  }, [flushQueue]);

  const openBanner = useCallback(async () => {
    if (!banner?.payload) {
      dismissBanner();
      return;
    }

    await handlePushNotificationResponse(router, banner.payload);
    dismissBanner();
  }, [banner?.payload, dismissBanner, router]);

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const receiveSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const payload = asRecord(notification.request.content.data);
        const parsed = parsePushNotificationPayload(payload);

        if (parsed.payload?.priority === "LOW") {
          return;
        }

        const title =
          notification.request.content.title ??
          parsed.payload?.title ??
          "Powiadomienie";
        const body =
          notification.request.content.body ??
          parsed.payload?.body ??
          "Masz nowe powiadomienie";

        enqueueBanner({
          title,
          body,
          payload,
        });
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const responseId = response.notification.request.identifier;
        if (lastHandledResponseIdRef.current === responseId) return;
        lastHandledResponseIdRef.current = responseId;
        const payload = asRecord(response.notification.request.content.data);
        void handlePushNotificationResponse(router, payload);
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const responseId = response.notification.request.identifier;
      if (lastHandledResponseIdRef.current === responseId) return;
      lastHandledResponseIdRef.current = responseId;
      const payload = asRecord(response.notification.request.content.data);
      void handlePushNotificationResponse(router, payload);
    });

    return () => {
      receiveSubscription.remove();
      responseSubscription.remove();
    };
  }, [enqueueBanner, router]);

  return {
    banner,
    dismissBanner,
    openBanner,
  };
};
