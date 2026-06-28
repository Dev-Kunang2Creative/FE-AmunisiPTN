import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TicketReportPaginated } from "./get-ticket-reports";

interface AdminGetUserTicketReportsParams {
  token: string;
  userId: string;
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}

export const AdminGetUserTicketReportsHandler = async ({
  token,
  userId,
  page = 1,
  per_page = 15,
  status,
  search,
}: AdminGetUserTicketReportsParams): Promise<TicketReportPaginated> => {
  const params: Record<string, string | number> = { page, per_page };
  if (status) params.status = status;
  if (search) params.search = search;

  const { data } = await api.get<TicketReportPaginated>(
    `/admin/users/${userId}/ticket-reports`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );
  return data;
};

export const useAdminGetUserTicketReports = ({
  token,
  userId,
  page,
  per_page,
  status,
  search,
  options,
}: AdminGetUserTicketReportsParams & {
  options?: Partial<UseQueryOptions<TicketReportPaginated, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["admin-get-user-ticket-reports", userId, page, per_page, status, search],
    queryFn: () =>
      AdminGetUserTicketReportsHandler({ token, userId, page, per_page, status, search }),
    enabled: !!token && !!userId,
    ...options,
  });
};
