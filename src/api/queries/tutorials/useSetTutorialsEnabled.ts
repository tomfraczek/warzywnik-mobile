import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tutorialKeys } from "./tutorialKeys";
import { TutorialsDto } from "./types";

const setTutorialsEnabled = async (enabled: boolean) => {
  const { data } = await restClient.patch("/users/me/tutorials", { enabled });
  return data;
};

export const useSetTutorialsEnabled = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setTutorialsEnabled,
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: tutorialKeys.all });
      const previous = queryClient.getQueryData<TutorialsDto>(tutorialKeys.all);
      queryClient.setQueryData<TutorialsDto>(
        tutorialKeys.all,
        (old) => old ? { ...old, enabled } : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(tutorialKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: tutorialKeys.all });
    },
  });
};
