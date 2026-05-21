import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

export type PushDiagnosticsState = {
  pushEnabledInApp: boolean | null;
  systemPermissionGranted: boolean | null;
  lastGetPermissionsResult: unknown | null;
  lastRequestPermissionsResult: unknown | null;
  expoPushToken: string | null;
  backendRegistrationStatus:
    | "idle"
    | "success"
    | "error"
    | "disabled"
    | "skipped";
  platform: string;
  appVersion: string;
  buildVersion: string;
  runtimeVersion: string;
  easChannel: string;
  appOwnership: string;
  executionEnvironment: string;
  isPhysicalDevice: boolean | null;
  lastRegisterDevicePayload: unknown | null;
  lastRegisterDeviceResponse: unknown | null;
  lastRegisterDeviceError: string | null;
  lastDisableDeviceResponse: unknown | null;
  lastDisableDeviceError: string | null;
  lastNotificationReceivedAt: string | null;
  lastNotificationOpenedAt: string | null;
};

const listeners = new Set<() => void>();

const asString = (value: unknown, fallback = "unknown") => {
  if (typeof value !== "string" || value.trim().length === 0) return fallback;
  return value;
};

const getRuntimeVersion = () => {
  const value = Updates.runtimeVersion;
  if (typeof value === "string" && value.trim().length > 0) return value;

  const fromConfig =
    (Constants.expoConfig?.runtimeVersion as string | undefined) ??
    (Constants.expoConfig?.ios?.runtimeVersion as string | undefined) ??
    (Constants.expoConfig?.android?.runtimeVersion as string | undefined);

  return asString(fromConfig, "unknown");
};

const initialState: PushDiagnosticsState = {
  pushEnabledInApp: null,
  systemPermissionGranted: null,
  lastGetPermissionsResult: null,
  lastRequestPermissionsResult: null,
  expoPushToken: null,
  backendRegistrationStatus: "idle",
  platform: Platform.OS,
  appVersion: asString(
    Application.nativeApplicationVersion ??
      Constants.nativeAppVersion ??
      Constants.expoConfig?.version,
  ),
  buildVersion: asString(
    Application.nativeBuildVersion ??
      Constants.nativeBuildVersion ??
      (typeof Constants.expoConfig?.android?.versionCode === "number"
        ? String(Constants.expoConfig.android.versionCode)
        : undefined),
  ),
  runtimeVersion: getRuntimeVersion(),
  easChannel: asString(Updates.channel),
  appOwnership: asString(Constants.appOwnership),
  executionEnvironment: asString(String(Constants.executionEnvironment)),
  isPhysicalDevice: null,
  lastRegisterDevicePayload: null,
  lastRegisterDeviceResponse: null,
  lastRegisterDeviceError: null,
  lastDisableDeviceResponse: null,
  lastDisableDeviceError: null,
  lastNotificationReceivedAt: null,
  lastNotificationOpenedAt: null,
};

let state: PushDiagnosticsState = initialState;

const emit = () => {
  listeners.forEach((listener) => listener());
};

export const getPushDiagnosticsState = () => state;

export const updatePushDiagnosticsState = (
  patch: Partial<PushDiagnosticsState>,
) => {
  state = {
    ...state,
    ...patch,
  };
  emit();
};

export const subscribePushDiagnosticsState = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const isPushDiagnosticsVisible = () => {
  return true;
};
