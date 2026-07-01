import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { tutorialKeys } from "./tutorialKeys";
import { TutorialsDto } from "./types";

const getTutorials = async (): Promise<TutorialsDto> => {
  const { data } = await restClient.get<TutorialsDto>("/users/me/tutorials");
  return data;
};

export const useTutorials = (enabled = true) =>
  useQuery({
    queryKey: tutorialKeys.all,
    queryFn: getTutorials,
    enabled,
  });
