import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "@/lib/axios";
import { User } from "@/types/user/user";

export interface GetVipUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  filter_type?: "all_vip" | "date_range";
  start_date?: string;
  end_date?: string;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface GetVipUsersResponse extends PaginationMeta {
  data: User[];
}

export const GetVipUsersHandler = async (
  token: string,
  params: GetVipUsersParams
): Promise<GetVipUsersResponse> => {
  const { data } = await api.get<GetVipUsersResponse>("/admin/users/vip-preview", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page: params.page,
      per_page: params.perPage,
      search: params.search,
      filter_type: params.filter_type,
      start_date: params.start_date,
      end_date: params.end_date,
    },
  });

  return data;
};

export const useGetVipUsers = ({
  token,
  page = 1,
  perPage = 10,
  search = "",
  filter_type = "all_vip",
  start_date = "",
  end_date = "",
  options,
}: GetVipUsersParams & {
  token: string;
  options?: Partial<UseQueryOptions<GetVipUsersResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-vip-users", page, perPage, search, filter_type, start_date, end_date],
    queryFn: () =>
      GetVipUsersHandler(token, {
        page,
        perPage,
        search,
        filter_type,
        start_date,
        end_date,
      }),
    ...options,
  });
};
