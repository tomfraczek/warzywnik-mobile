import { restClient } from "@/src/api/axios";
import { Device, RegisterDeviceDto } from "@/src/api/queries/devices/types";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "pushDeviceId";
const LAST_PUSH_TOKEN_KEY = "pushLastExpoToken";

export const requestPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return existing;
  return Notifications.requestPermissionsAsync();
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF231F7C",
  });
};

const getExpoProjectId = () =>
  Constants.easConfig?.projectId ??
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.expoConfig?.extra?.projectId ??
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

export const getExpoToken = async () => {
  await ensureAndroidChannel();
  const projectId = getExpoProjectId();
  if (!projectId) {
    throw new Error(
      "Missing Expo projectId. Set extra.eas.projectId in app.json or EXPO_PUBLIC_EAS_PROJECT_ID.",
    );
  }
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  return tokenResponse.data;
};

export const getStoredDeviceId = async () => {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
};

export const getStoredPushToken = async () => {
  return SecureStore.getItemAsync(LAST_PUSH_TOKEN_KEY);
};

const setStoredDeviceId = async (deviceId: string) => {
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
};

const setStoredPushToken = async (expoPushToken: string) => {
  await SecureStore.setItemAsync(LAST_PUSH_TOKEN_KEY, expoPushToken);
};

const clearStoredDeviceId = async () => {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
};

const clearStoredPushToken = async () => {
  await SecureStore.deleteItemAsync(LAST_PUSH_TOKEN_KEY);
};

export const clearStoredPushRegistration = async () => {
  await Promise.all([clearStoredDeviceId(), clearStoredPushToken()]);
};

export const registerDevice = async (
  payload?: Partial<RegisterDeviceDto>,
): Promise<Device> => {
  const expoPushToken = payload?.expoPushToken ?? (await getExpoToken());
  const platform = payload?.platform ?? Platform.OS;
  const { data } = await restClient.post("/devices", {
    expoPushToken,
    platform,
  });
  if (data?.id) {
    await setStoredDeviceId(data.id);
  }
  await setStoredPushToken(expoPushToken);
  return data;
};

export const disableDevice = async (
  deviceId?: string | null,
): Promise<Device> => {
  const resolvedDeviceId = deviceId ?? (await getStoredDeviceId());
  if (!resolvedDeviceId) {
    throw new Error("Device id not found");
  }

  try {
    const { data } = await restClient.patch(`/devices/${resolvedDeviceId}`, {
      isEnabled: false,
    });
    await clearStoredPushRegistration();
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 404) {
      await clearStoredPushRegistration();
    }
    throw error;
  }
};
