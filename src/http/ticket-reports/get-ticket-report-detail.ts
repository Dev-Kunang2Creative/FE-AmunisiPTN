import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TicketReport } from "./get-ticket-reports";

interface GetTicketReportDetailResponse {
  success: boolean;
  data: TicketReport;
}

export const GetTicketReportDetailHandler = async (
  token: string,
  id: string
): Promise<GetTicketReportDetailResponse> => {
  const { data } = await api.get<GetTicketReportDetailResponse>(
    `/ticket-reports/${id}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const useGetTicketReportDetail = ({
  token,
  id,
  options,
}: {
  token: string;
  id: string;
  options?: Partial<UseQueryOptions<GetTicketReportDetailResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-ticket-report-detail", id],
    queryFn: () => GetTicketReportDetailHandler(token, id),
    enabled: !!token && !!id,
    ...options,
  });
};
