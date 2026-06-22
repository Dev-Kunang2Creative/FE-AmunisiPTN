import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "@/lib/axios";

export interface InjectVipTicketsPayload {
  amount: number;
  description: string;
  filter_type: "all_vip" | "date_range" | "single_user";
  start_date?: string;
  end_date?: string;
  user_id?: string;
  action?: "inject" | "pull";
}

export interface InjectVipTicketsResponse {
  message: string;
}

export const InjectVipTicketsHandler = async (
  payload: InjectVipTicketsPayload,
  token: string
): Promise<InjectVipTicketsResponse> => {
  const { data } = await api.post<InjectVipTicketsResponse>(
    "/admin/users/inject-vip-tickets",
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data;
};

export const useInjectVipTickets = ({
  token,
  options,
}: {
  token: string;
  options?: Partial<
    UseMutationOptions<InjectVipTicketsResponse, AxiosError, InjectVipTicketsPayload>
  >;
}) => {
  return useMutation({
    mutationFn: (payload: InjectVipTicketsPayload) =>
      InjectVipTicketsHandler(payload, token),
    ...options,
  });
};
