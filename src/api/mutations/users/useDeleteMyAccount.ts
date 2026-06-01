import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";

const deleteMyAccount = async (): Promise<void> => {
  await restClient.delete("/users/me");
};

export const useDeleteMyAccount = () =>
  useMutation({
    mutationFn: deleteMyAccount,
  });
