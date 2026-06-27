import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { TicketReport } from "./get-ticket-reports";

interface CreateTicketReportPayload {
  token: string;
  title: string;
  description: string;
  images?: File[];
}

interface CreateTicketReportResponse {
  success: boolean;
  data: TicketReport;
}

export const CreateTicketReportHandler = async ({
  token,
  title,
  description,
  images,
}: CreateTicketReportPayload): Promise<CreateTicketReportResponse> => {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);

  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append("images[]", image);
    });
  }

  const { data } = await api.post<CreateTicketReportResponse>(
    "/ticket-reports",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return data;
};

export const useCreateTicketReport = (
  options?: Partial<
    UseMutationOptions<
      CreateTicketReportResponse,
      AxiosError,
      CreateTicketReportPayload
    >
  >
) => {
  return useMutation({
    mutationFn: CreateTicketReportHandler,
    ...options,
  });
};
