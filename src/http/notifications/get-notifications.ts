import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { GetNotificationsResponse } from "@/types/notification";

export const GetNotificationsHandler = async (
  token: string,
  page = 1,
  perPage = 15
): Promise<GetNotificationsResponse> => {
  const { data } = await api.get<GetNotificationsResponse>("/notifications", {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, per_page: perPage },
  });
  return data;
};

export const useGetNotifications = ({
  token,
  page = 1,
  perPage = 15,
  options,
}: {
  token: string;
  page?: number;
  perPage?: number;
  options?: Partial<UseQueryOptions<GetNotificationsResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-notifications", page, perPage],
    queryFn: () => GetNotificationsHandler(token, page, perPage),
    enabled: !!token,
    ...options,
  });
};
