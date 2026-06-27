import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

interface PostAdminTicketReplyParams {
  token: string;
  id: string;
  message: string;
}

interface PostAdminTicketReplyResponse {
  success: boolean;
  data: {
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
  };
}

export const PostAdminTicketReplyHandler = async ({
  token,
  id,
  message,
}: PostAdminTicketReplyParams): Promise<PostAdminTicketReplyResponse> => {
  const { data } = await api.post<PostAdminTicketReplyResponse>(
    `/admin/ticket-reports/${id}/reply`,
    { message },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const usePostAdminTicketReply = (
  options?: UseMutationOptions<
    PostAdminTicketReplyResponse,
    AxiosError,
    PostAdminTicketReplyParams
  >
) => {
  return useMutation({
    mutationFn: PostAdminTicketReplyHandler,
    ...options,
  });
};
