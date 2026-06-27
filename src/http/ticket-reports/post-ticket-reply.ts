import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

interface PostTicketReplyParams {
  token: string;
  id: string;
  message: string;
}

interface PostTicketReplyResponse {
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

export const PostTicketReplyHandler = async ({
  token,
  id,
  message,
}: PostTicketReplyParams): Promise<PostTicketReplyResponse> => {
  const { data } = await api.post<PostTicketReplyResponse>(
    `/ticket-reports/${id}/reply`,
    { message },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

export const usePostTicketReply = (
  options?: UseMutationOptions<
    PostTicketReplyResponse,
    AxiosError,
    PostTicketReplyParams
  >
) => {
  return useMutation({
    mutationFn: PostTicketReplyHandler,
    ...options,
  });
};
