import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tutorialKeys } from "./tutorialKeys";

const resetTutorials = async () => {
  const { data } = await restClient.post("/users/me/tutorials/reset");
  return data;
};

export const useResetTutorials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetTutorials,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tutorialKeys.all });
    },
  });
};
