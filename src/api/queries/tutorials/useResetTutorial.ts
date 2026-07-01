import { restClient } from "@/src/api/axios";
import { TutorialKey } from "@/src/constants/tutorialVersions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tutorialKeys } from "./tutorialKeys";

const resetTutorial = async (key: TutorialKey) => {
  const { data } = await restClient.post(`/users/me/tutorials/${key}/reset`);
  return data;
};

export const useResetTutorial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetTutorial,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tutorialKeys.all });
    },
  });
};
