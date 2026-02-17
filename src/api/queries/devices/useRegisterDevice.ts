import { registerDevice } from "@/src/features/push/push";
import { useMutation } from "@tanstack/react-query";
import { RegisterDeviceDto } from "./types";

export const useRegisterDevice = () => {
  return useMutation({
    mutationFn: (payload: RegisterDeviceDto) => registerDevice(payload),
  });
};
