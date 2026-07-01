import { restClient } from "@/src/api/axios";
import {
  TUTORIAL_VERSIONS,
  TutorialKey,
} from "@/src/constants/tutorialVersions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tutorialKeys } from "./tutorialKeys";

const completeTutorial = async (key: TutorialKey) => {
  const { data } = await restClient.patch(`/users/me/tutorials/${key}`, {
    completed: true,
    version: TUTORIAL_VERSIONS[key],
  });
  return data;
};

export const useCompleteTutorial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeTutorial,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tutorialKeys.all });
    },
  });
};
