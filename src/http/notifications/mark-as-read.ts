import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

export interface MarkAsReadPayload {
  notification_id: string;
}

export const MarkAsReadHandler = async (
  token: string,
  payload: MarkAsReadPayload
): Promise<void> => {
  await api.patch(`/notifications/${payload.notification_id}/read`, undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const useMarkAsRead = (token: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, MarkAsReadPayload>({
    mutationFn: (payload) => MarkAsReadHandler(token, payload),
    onSuccess: () => {
      // Invalidate to refresh the unread count and the notifications list
      queryClient.invalidateQueries({ queryKey: ["get-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["get-unread-count"] });
    },
  });
};
