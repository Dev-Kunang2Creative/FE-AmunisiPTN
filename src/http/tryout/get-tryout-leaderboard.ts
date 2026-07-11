import { useQuery, useInfiniteQuery, type UseQueryOptions, type UseInfiniteQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TryoutLeaderboardData } from "@/types/exam/exam";

interface GetTryoutLeaderboardResponse {
  data: TryoutLeaderboardData;
}

export const GetTryoutLeaderboardHandler = async (
  tryoutId: string,
  token: string,
  page: number = 1,
  perPage?: number
): Promise<GetTryoutLeaderboardResponse> => {
  const { data } = await api.get<GetTryoutLeaderboardResponse>(
    `/tryouts/${tryoutId}/leaderboard`,
    { 
      headers: { Authorization: `Bearer ${token}` },
      params: { page, per_page: perPage }
    },
  );

  return data;
};

export const useGetTryoutLeaderboard = ({
  tryoutId,
  token,
  page = 1,
  perPage,
  options,
}: {
  tryoutId: string;
  token: string;
  page?: number;
  perPage?: number;
  options?: Partial<UseQueryOptions<GetTryoutLeaderboardResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-tryout-leaderboard", tryoutId, page, perPage],
    queryFn: () => GetTryoutLeaderboardHandler(tryoutId, token, page, perPage),
    enabled: !!tryoutId && !!token,
    ...options,
  });
};

export const useInfiniteGetTryoutLeaderboard = ({
  tryoutId,
  token,
  options,
}: {
  tryoutId: string;
  token: string;
  options?: any;
}) => {
  return useInfiniteQuery({
    queryKey: ["get-tryout-leaderboard-infinite", tryoutId],
    queryFn: ({ pageParam = 1 }) =>
      GetTryoutLeaderboardHandler(tryoutId, token, pageParam as number),
    getNextPageParam: (lastPage) => {
      const current = lastPage.data.leaderboard.current_page;
      const last = lastPage.data.leaderboard.last_page;
      return current < last ? current + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!tryoutId && !!token,
    ...options,
  });
};
