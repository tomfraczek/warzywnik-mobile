import { useDisableDevice } from "@/src/api/queries/devices/useDisableDevice";
import { useRegisterDevice } from "@/src/api/queries/devices/useRegisterDevice";
import { useGetNotificationPreferences } from "@/src/api/queries/notifications/useGetNotificationPreferences";
import {
  getExpoToken,
  getStoredDeviceId,
  getStoredPushToken,
  requestPermission,
} from "@/src/features/push/push";
import { useAuth } from "@clerk/clerk-expo";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

export const usePushNotificationsLifecycle = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const preferencesQuery = useGetNotificationPreferences({
    enabled: isLoaded && isSignedIn,
  });
  const registerDeviceMutation = useRegisterDevice();
  const disableDeviceMutation = useDisableDevice();

  const isRegisteringRef = useRef(false);
  const isDisablingRef = useRef(false);
  const lastRegisteredTokenRef = useRef<string | null>(null);

  const notificationsEnabled = preferencesQuery.data?.notificationsEnabled;

  const disableCurrentDevice = useCallback(async () => {
    if (isDisablingRef.current) return;
    isDisablingRef.current = true;

    try {
      const storedDeviceId = await getStoredDeviceId();
      if (!storedDeviceId) return;
      await disableDeviceMutation.mutateAsync({ deviceId: storedDeviceId });
      lastRegisteredTokenRef.current = null;
    } catch (error) {
      console.warn("Failed to disable push device", error);
    } finally {
      isDisablingRef.current = false;
    }
  }, [disableDeviceMutation]);

  const registerCurrentDevice = useCallback(
    async (tokenFromListener?: string) => {
      if (!isLoaded || !isSignedIn || notificationsEnabled !== true) return;
      if (isRegisteringRef.current) return;
      isRegisteringRef.current = true;

      try {
        const permission = await requestPermission();
        if (!permission.granted) {
          console.warn("Push permission not granted");
          return;
        }

        const expoPushToken = tokenFromListener ?? (await getExpoToken());
        const storedPushToken = await getStoredPushToken();
        const isTokenAlreadyRegistered =
          lastRegisteredTokenRef.current === expoPushToken ||
          storedPushToken === expoPushToken;

        if (isTokenAlreadyRegistered) {
          lastRegisteredTokenRef.current = expoPushToken;
          return;
        }

        await registerDeviceMutation.mutateAsync({
          expoPushToken,
          platform: Platform.OS,
        });
        lastRegisteredTokenRef.current = expoPushToken;
      } catch (error) {
        console.warn("Failed to register push device", error);
      } finally {
        isRegisteringRef.current = false;
      }
    },
    [isLoaded, isSignedIn, notificationsEnabled, registerDeviceMutation],
  );

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      void disableCurrentDevice();
      return;
    }

    if (notificationsEnabled === false) {
      void disableCurrentDevice();
      return;
    }

    if (notificationsEnabled !== true) {
      return;
    }

    void registerCurrentDevice();
  }, [
    disableCurrentDevice,
    isLoaded,
    isSignedIn,
    notificationsEnabled,
    registerCurrentDevice,
  ]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || notificationsEnabled !== true) return;

    const subscription = Notifications.addPushTokenListener((token) => {
      void registerCurrentDevice(token.data);
    });

    return () => {
      subscription.remove();
    };
  }, [isLoaded, isSignedIn, notificationsEnabled, registerCurrentDevice]);
};
