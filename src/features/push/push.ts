import { restClient } from "@/src/api/axios";
import { Device, RegisterDeviceDto } from "@/src/api/queries/devices/types";
import { updatePushDiagnosticsState } from "@/src/features/push/diagnostics";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as DeviceInfo from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "pushDeviceId";
const LAST_PUSH_TOKEN_KEY = "pushLastExpoToken";

export const requestPermission = async () => {
  const existing = await Notifications.getPermissionsAsync();
  updatePushDiagnosticsState({
    lastGetPermissionsResult: existing,
    systemPermissionGranted: Boolean(existing.granted),
  });

  if (__DEV__) {
    console.log("[push] getPermissionsAsync", existing);
  }

  if (existing.granted) return existing;

  const requested = await Notifications.requestPermissionsAsync();
  updatePushDiagnosticsState({
    lastRequestPermissionsResult: requested,
    systemPermissionGranted: Boolean(requested.granted),
  });

  if (__DEV__) {
    console.log("[push] requestPermissionsAsync", requested);
  }

  return requested;
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
  updatePushDiagnosticsState({
    isPhysicalDevice: DeviceInfo.isDevice,
  });

  if (!DeviceInfo.isDevice) {
    throw new Error(
      "Expo push token can be generated only on a physical device.",
    );
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    throw new Error(
      "Missing Expo projectId. Set extra.eas.projectId in app.json or EXPO_PUBLIC_EAS_PROJECT_ID.",
    );
  }
  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const token = tokenResponse.data;
  updatePushDiagnosticsState({ expoPushToken: token });

  if (__DEV__) {
    console.log("[push] getExpoPushTokenAsync token", token);
  }

  return token;
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
  const requestPayload = {
    expoPushToken,
    platform,
    appVersion:
      payload?.appVersion ??
      Application.nativeApplicationVersion ??
      Constants.nativeAppVersion ??
      Constants.expoConfig?.version,
    buildVersion:
      payload?.buildVersion ??
      Application.nativeBuildVersion ??
      Constants.nativeBuildVersion ??
      (typeof Constants.expoConfig?.android?.versionCode === "number"
        ? String(Constants.expoConfig.android.versionCode)
        : undefined),
    runtimeVersion:
      payload?.runtimeVersion ??
      Updates.runtimeVersion ??
      (typeof Constants.expoConfig?.runtimeVersion === "string"
        ? Constants.expoConfig.runtimeVersion
        : undefined),
    easChannel: payload?.easChannel ?? Updates.channel,
  };

  updatePushDiagnosticsState({
    expoPushToken,
    lastRegisterDevicePayload: requestPayload,
    lastRegisterDeviceError: null,
  });

  if (__DEV__) {
    console.log("[push] registerDevice payload", requestPayload);
  }

  const { data } = await restClient.post("/devices", requestPayload);

  updatePushDiagnosticsState({
    backendRegistrationStatus: "success",
    lastRegisterDeviceResponse: data,
  });

  if (__DEV__) {
    console.log("[push] registerDevice response", data);
  }

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
    if (__DEV__) {
      console.log("[push] disableDevice", { deviceId: resolvedDeviceId });
    }

    const { data } = await restClient.patch(`/devices/${resolvedDeviceId}`, {
      isEnabled: false,
    });
    updatePushDiagnosticsState({
      backendRegistrationStatus: "disabled",
      lastDisableDeviceResponse: data,
      lastDisableDeviceError: null,
    });

    await clearStoredPushRegistration();
    return data;
  } catch (error: any) {
    const status = error?.response?.status;
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Unknown disableDevice error";
    updatePushDiagnosticsState({
      lastDisableDeviceError: message,
    });

    if (status === 401 || status === 404) {
      await clearStoredPushRegistration();
    }
    throw error;
  }
};
