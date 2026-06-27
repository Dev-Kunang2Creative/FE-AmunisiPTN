import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TicketReport, TicketReportPaginated } from "./get-ticket-reports";

interface AdminGetTicketReportsParams {
  token: string;
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
}

export const AdminGetTicketReportsHandler = async ({
  token,
  page = 1,
  per_page = 15,
  status,
  search,
}: AdminGetTicketReportsParams): Promise<TicketReportPaginated> => {
  const params: Record<string, string | number> = { page, per_page };
  if (status) params.status = status;
  if (search) params.search = search;

  const { data } = await api.get<TicketReportPaginated>(
    "/admin/ticket-reports",
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );
  return data;
};

export const useAdminGetTicketReports = ({
  token,
  page,
  per_page,
  status,
  search,
  options,
}: AdminGetTicketReportsParams & {
  options?: Partial<UseQueryOptions<TicketReportPaginated, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["admin-get-ticket-reports", page, per_page, status, search],
    queryFn: () =>
      AdminGetTicketReportsHandler({ token, page, per_page, status, search }),
    enabled: !!token,
    ...options,
  });
};

interface AdminGetTicketReportDetailResponse {
  success: boolean;
  data: TicketReport;
}

export const AdminGetTicketReportDetailHandler = async (
  token: string,
  id: string
): Promise<AdminGetTicketReportDetailResponse> => {
  const { data } = await api.get<AdminGetTicketReportDetailResponse>(
    `/admin/ticket-reports/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};
