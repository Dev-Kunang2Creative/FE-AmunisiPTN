import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "@/lib/axios";

export interface TicketLog {
  id: string;
  user_id: string;
  type: "credit" | "debit";
  amount: number;
  source: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface GetUserTicketLogsResponse {
  current_page: number;
  data: TicketLog[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const GetUserTicketLogsHandler = async (
  userId: string,
  page: number,
  perPage: number,
  token: string
): Promise<GetUserTicketLogsResponse> => {
  const { data } = await api.get<GetUserTicketLogsResponse>(
    `/admin/users/${userId}/ticket-logs?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};

export const useGetUserTicketLogs = ({
  userId,
  page,
  perPage,
  token,
  options,
}: {
  userId: string;
  page: number;
  perPage: number;
  token: string;
  options?: Partial<UseQueryOptions<GetUserTicketLogsResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-user-ticket-logs", userId, page, perPage],
    queryFn: () => GetUserTicketLogsHandler(userId, page, perPage, token),
    enabled: !!token && !!userId,
    ...options,
  });
};
