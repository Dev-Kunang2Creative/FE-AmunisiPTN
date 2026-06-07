import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

interface GoogleRedirectResponse {
  url: string;
}

interface ExchangeGoogleCodeResponse {
  token: string;
}

export const GetGoogleRedirectHandler =
  async (): Promise<GoogleRedirectResponse> => {
    const { data } = await api.get<GoogleRedirectResponse>(
      "/auth/google/redirect",
    );

    return data;
  };

export const ExchangeGoogleCodeHandler = async (
  code: string,
): Promise<ExchangeGoogleCodeResponse> => {
  const { data } = await api.post<ExchangeGoogleCodeResponse>(
    "/auth/google/exchange-code",
    { code },
  );

  return data;
};

export const useGetGoogleRedirect = ({
  options,
}: {
  options?: Partial<UseQueryOptions<GoogleRedirectResponse, AxiosError>>;
}) => {
  return useQuery({
    queryKey: ["get-google-redirect"],
    queryFn: GetGoogleRedirectHandler,
    enabled: false,
    ...options,
  });
};
