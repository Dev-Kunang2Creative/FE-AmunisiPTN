import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

export interface GetUnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}

export const GetUnreadCountHandler = async (
  token: string
): Promise<GetUnreadCountResponse> => {
  const { data } = await api.get<GetUnreadCountResponse>("/notifications/unread-count", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const useGetUnreadCount = ({
  token,
  options,
}: {
  token: string;
  options?: Partial<UseQueryOptions<GetUnreadCountResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-unread-count"],
    queryFn: () => GetUnreadCountHandler(token),
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds
    ...options,
  });
};
