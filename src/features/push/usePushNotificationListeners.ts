import { queryClient } from "@/src/api/queryClient";
import { updatePushDiagnosticsState } from "@/src/features/push/diagnostics";
import { handlePushNotificationResponse } from "@/src/features/push/handlePushNotificationResponse";
import { parsePushNotificationPayload } from "@/src/features/push/parsePushNotificationPayload";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRootNavigationState, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
};

export const usePushNotificationListeners = () => {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const isRootNavigationMounted = Boolean(rootNavigationState?.key);

  const lastHandledResponseIdRef = useRef<string | null>(null);
  const isRootNavigationMountedRef = useRef(false);
  const pendingResponseRef = useRef<{
    responseId: string;
    payload: Record<string, unknown> | null;
  } | null>(null);

  const handleNotificationResponse = useCallback(
    (responseId: string, payload: Record<string, unknown> | null) => {
      if (lastHandledResponseIdRef.current === responseId) return;

      if (!isRootNavigationMountedRef.current) {
        pendingResponseRef.current = { responseId, payload };
        return;
      }

      lastHandledResponseIdRef.current = responseId;
      void handlePushNotificationResponse(router, payload);
    },
    [router],
  );

  useEffect(() => {
    isRootNavigationMountedRef.current = isRootNavigationMounted;
    if (!isRootNavigationMounted) return;

    const pending = pendingResponseRef.current;
    if (!pending) return;

    pendingResponseRef.current = null;
    handleNotificationResponse(pending.responseId, pending.payload);
  }, [handleNotificationResponse, isRootNavigationMounted]);

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
        updatePushDiagnosticsState({
          lastNotificationReceivedAt: new Date().toISOString(),
        });

        if (__DEV__) {
          console.log("[push] addNotificationReceivedListener", {
            identifier: notification.request.identifier,
            data: notification.request.content.data,
          });
        }

        const payload = asRecord(notification.request.content.data);
        const parsed = parsePushNotificationPayload(payload);

        if (parsed.payload?.priority === "LOW") {
          return;
        }

        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["notifications", "list"],
          }),
          queryClient.invalidateQueries({
            queryKey: ["notifications", "summary"],
          }),
        ]);

        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      },
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const responseId = response.notification.request.identifier;
        const payload = asRecord(response.notification.request.content.data);
        updatePushDiagnosticsState({
          lastNotificationOpenedAt: new Date().toISOString(),
        });

        if (__DEV__) {
          console.log("[push] addNotificationResponseReceivedListener", {
            responseId,
            payload,
          });
        }

        handleNotificationResponse(responseId, payload);
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const responseId = response.notification.request.identifier;
      const payload = asRecord(response.notification.request.content.data);
      updatePushDiagnosticsState({
        lastNotificationOpenedAt: new Date().toISOString(),
      });
      handleNotificationResponse(responseId, payload);
    });

    return () => {
      receiveSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleNotificationResponse]);
};
