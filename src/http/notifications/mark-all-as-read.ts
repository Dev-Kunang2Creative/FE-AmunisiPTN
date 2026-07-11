import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

export const MarkAllAsReadHandler = async (
  token: string
): Promise<void> => {
  await api.post("/notifications/mark-all-read", undefined, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const useMarkAllAsRead = (token: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, void>({
    mutationFn: () => MarkAllAsReadHandler(token),
    onSuccess: () => {
      // Invalidate to refresh the notifications list
      queryClient.invalidateQueries({ queryKey: ["get-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["get-unread-count"] });
    },
  });
};
