import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";
import { Device, RegisterDeviceDto } from "./types";

const registerDevice = async (payload: RegisterDeviceDto): Promise<Device> => {
  const { data } = await restClient.post("/devices", payload);
  return data;
};

export const useRegisterDevice = () => {
  return useMutation({
    mutationFn: (payload: RegisterDeviceDto) => registerDevice(payload),
  });
};
