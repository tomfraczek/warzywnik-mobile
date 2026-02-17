import { disableDevice } from "@/src/features/push/push";
import { useMutation } from "@tanstack/react-query";

export const useDisableDevice = () => {
  return useMutation({
    mutationFn: ({ deviceId }: { deviceId: string }) => disableDevice(deviceId),
  });
};
