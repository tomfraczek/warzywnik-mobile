export type DevicePlatform = "ios" | "android" | "web" | string;

export type Device = {
  id: string;
  expoPushToken: string;
  platform: DevicePlatform;
  isEnabled?: boolean | null;
};

export type RegisterDeviceDto = {
  expoPushToken: string;
  platform: DevicePlatform;
  appVersion?: string;
  buildVersion?: string;
  runtimeVersion?: string;
  easChannel?: string;
};

export type DisableDeviceDto = {
  isEnabled: false;
};
