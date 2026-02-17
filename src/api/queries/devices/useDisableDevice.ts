import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";
import { Device, DisableDeviceDto } from "./types";

const disableDevice = async (deviceId: string): Promise<Device> => {
  const payload: DisableDeviceDto = { isEnabled: false };
  const { data } = await restClient.patch(`/devices/${deviceId}`, payload);
  return data;
};

export const useDisableDevice = () => {
  return useMutation({
    mutationFn: ({ deviceId }: { deviceId: string }) => disableDevice(deviceId),
  });
};
