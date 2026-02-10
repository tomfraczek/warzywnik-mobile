import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { articleKeys } from "./articleKeys";
import { Article } from "./types";

const getArticle = async (slug: string): Promise<Article> => {
  const { data } = await restClient.get<Article>(`/articles/${slug}`);
  return data;
};

export const useGetArticle = (slug: string | null) => {
  return useQuery({
    queryKey: slug ? articleKeys.detail(slug) : articleKeys.detail("unknown"),
    queryFn: () => getArticle(slug as string),
    enabled: Boolean(slug),
  });
};
