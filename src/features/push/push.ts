import { restClient } from "@/src/api/axios";
import { Device, RegisterDeviceDto } from "@/src/api/queries/devices/types";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "pushDeviceId";

export const requestPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return existing;
  return Notifications.requestPermissionsAsync();
};

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const getExpoProjectId = () =>
  Constants.easConfig?.projectId ??
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants.expoConfig?.extra?.projectId;

export const getExpoToken = async () => {
  await ensureAndroidChannel();
  const projectId = getExpoProjectId();
  const tokenResponse = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return tokenResponse.data;
};

export const getStoredDeviceId = async () => {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
};

const setStoredDeviceId = async (deviceId: string) => {
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
};

const clearStoredDeviceId = async () => {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
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
  return data;
};

export const disableDevice = async (
  deviceId?: string | null,
): Promise<Device> => {
  const resolvedDeviceId = deviceId ?? (await getStoredDeviceId());
  if (!resolvedDeviceId) {
    throw new Error("Device id not found");
  }
  const { data } = await restClient.patch(`/devices/${resolvedDeviceId}`, {
    isEnabled: false,
  });
  await clearStoredDeviceId();
  return data;
};
