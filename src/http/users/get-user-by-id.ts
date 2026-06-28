import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";
import type { User } from "@/types/user/user";

export interface GetUserByIdResponse {
  data: User & {
    // Assuming the backend includes these statistics in the single user response,
    // otherwise we might need to fetch them separately or calculate them.
    statistics?: {
      total_tickets?: number;
      total_tryouts?: number;
      completed_tryouts?: number;
      average_score?: number;
    };
  };
}

export const GetUserByIdHandler = async (
  token: string,
  userId: string
): Promise<GetUserByIdResponse> => {
  const { data } = await api.get<GetUserByIdResponse>(`/admin/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const useGetUserById = ({
  token,
  userId,
  options,
}: {
  token: string;
  userId: string;
  options?: Partial<UseQueryOptions<GetUserByIdResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-user-by-id", userId],
    queryFn: () => GetUserByIdHandler(token, userId),
    enabled: !!token && !!userId,
    ...options,
  });
};
