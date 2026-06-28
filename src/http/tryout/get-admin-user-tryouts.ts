import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

// This type represents the tryout history record as requested by the spec.
// If the backend returns a different structure, this interface should be updated.
export interface AdminUserTryoutHistory {
  id: string;
  tryout_id: string;
  title: string;
  category?: string;
  score: number;
  rank?: number;
  duration?: string;
  status: "Completed" | "Ongoing" | "Abandoned" | "Selesai" | "Sedang Dikerjakan" | string;
  submitted_at: string;
}

export interface GetAdminUserTryoutsResponse {
  data: AdminUserTryoutHistory[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const GetAdminUserTryoutsHandler = async (
  token: string,
  userId: string,
  page = 1,
  search = "",
  perPage = 15
): Promise<GetAdminUserTryoutsResponse> => {
  const { data } = await api.get<GetAdminUserTryoutsResponse>(
    `/admin/users/${userId}/tryouts`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, search: search || undefined, per_page: perPage },
    }
  );
  return data;
};

export const useGetAdminUserTryouts = ({
  token,
  userId,
  page = 1,
  search = "",
  perPage = 15,
  options,
}: {
  token: string;
  userId: string;
  page?: number;
  search?: string;
  perPage?: number;
  options?: Partial<UseQueryOptions<GetAdminUserTryoutsResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-admin-user-tryouts", userId, page, search, perPage],
    queryFn: () => GetAdminUserTryoutsHandler(token, userId, page, search, perPage),
    enabled: !!token && !!userId,
    ...options,
  });
};
