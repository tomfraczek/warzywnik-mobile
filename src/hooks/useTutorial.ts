import { useCompleteTutorial } from "@/src/api/queries/tutorials/useCompleteTutorial";
import { useSetTutorialsEnabled } from "@/src/api/queries/tutorials/useSetTutorialsEnabled";
import { useTutorials } from "@/src/api/queries/tutorials/useTutorials";
import {
  TUTORIAL_VERSIONS,
  TutorialKey,
} from "@/src/constants/tutorialVersions";
import { useAuth } from "@clerk/clerk-expo";
import { useCallback } from "react";
import { TutorialsDto } from "@/src/api/queries/tutorials/types";

function shouldShowTutorial(
  data: TutorialsDto | undefined,
  key: TutorialKey,
): boolean {
  if (!data) return false;
  if (!data.enabled) return false;
  const saved = data.tutorials[key];
  const currentVersion = TUTORIAL_VERSIONS[key];
  return !saved || saved.completed !== true || saved.version < currentVersion;
}

export function useTutorial(key: TutorialKey) {
  const { isSignedIn } = useAuth();
  const { data } = useTutorials(isSignedIn === true);
  const { mutate: completeMutation } = useCompleteTutorial();
  const { mutate: disableMutation } = useSetTutorialsEnabled();

  const complete = useCallback(() => {
    completeMutation(key);
  }, [completeMutation, key]);

  const disable = useCallback(() => {
    disableMutation(false);
  }, [disableMutation]);

  return {
    enabled: data?.enabled ?? false,
    shouldShow: shouldShowTutorial(data, key),
    complete,
    disable,
  };
}
