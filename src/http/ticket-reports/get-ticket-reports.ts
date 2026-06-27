import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

export interface TicketReply {
  id: string;
  ticket_report_id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface TicketReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  images: string[] | null;
  status: "OPEN" | "IN_PROGRESS" | "SOLVED";
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  replies?: TicketReply[];
}

export interface TicketReportPaginated {
  data: TicketReport[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface GetTicketReportsParams {
  token: string;
  page?: number;
  per_page?: number;
}

export const GetTicketReportsHandler = async ({
  token,
  page = 1,
  per_page = 10,
}: GetTicketReportsParams): Promise<TicketReportPaginated> => {
  const { data } = await api.get<TicketReportPaginated>("/ticket-reports", {
    headers: { Authorization: `Bearer ${token}` },
    params: { page, per_page },
  });
  return data;
};

export const useGetTicketReports = ({
  token,
  page,
  per_page,
  options,
}: GetTicketReportsParams & {
  options?: Partial<UseQueryOptions<TicketReportPaginated, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-ticket-reports", page, per_page],
    queryFn: () => GetTicketReportsHandler({ token, page, per_page }),
    enabled: !!token,
    ...options,
  });
};
