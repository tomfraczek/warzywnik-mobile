import { restClient } from "@/src/api/axios";
import { useInfiniteQuery } from "@tanstack/react-query";
import { articleKeys, ArticleListParams } from "./articleKeys";
import { ArticleListItem, ArticlesListResponse } from "./types";

const getArticles = async (params: ArticleListParams, pageParam: number) => {
  const limit = params.limit ?? 20;
  const { data } = await restClient.get<ArticlesListResponse>("/articles", {
    params: {
      page: pageParam,
      limit,
      status: "PUBLISHED",
      month: params.month,
      season: params.season,
      context: params.context,
    },
  });

  const items: ArticleListItem[] = data?.items ?? [];
  const page = data?.page ?? pageParam;
  const total = data?.total ?? items.length;
  const nextPage = page * limit < total ? page + 1 : undefined;

  return {
    items,
    page,
    total,
    nextPage,
  };
};

export const useGetArticles = (params: ArticleListParams = {}) => {
  return useInfiniteQuery({
    queryKey: articleKeys.list(params),
    queryFn: ({ pageParam = 1 }) => getArticles(params, pageParam as number),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
};
