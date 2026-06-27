import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TicketReport } from "./get-ticket-reports";

interface UpdateTicketStatusPayload {
  token: string;
  id: string;
  status: "IN_PROGRESS" | "SOLVED";
}

interface UpdateTicketStatusResponse {
  success: boolean;
  data: TicketReport;
}

export const AdminUpdateTicketStatusHandler = async ({
  token,
  id,
  status,
}: UpdateTicketStatusPayload): Promise<UpdateTicketStatusResponse> => {
  const { data } = await api.patch<UpdateTicketStatusResponse>(
    `/admin/ticket-reports/${id}/status`,
    { status },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const useAdminUpdateTicketStatus = (
  options?: Partial<
    UseMutationOptions<
      UpdateTicketStatusResponse,
      AxiosError,
      UpdateTicketStatusPayload
    >
  >
) => {
  return useMutation({
    mutationFn: AdminUpdateTicketStatusHandler,
    ...options,
  });
};
