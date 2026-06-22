import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { api } from "@/lib/axios";

interface SubmitAnswerResponse {
  message: string;
  data: {
    question_id: string;
    answer: string | null;
  };
}

interface SubmitAnswerPayload {
  tryoutId: string;
  subtestId: string;
  questionId: string;
  answer: string | null; // A, B, C, D, E or null to clear
}

export const SubmitAnswerHandler = async (
  payload: SubmitAnswerPayload,
  token: string
): Promise<SubmitAnswerResponse> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/tryouts/${payload.tryoutId}/subtests/${payload.subtestId}/questions/${payload.questionId}/answer`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
    },
    body: JSON.stringify({ answer: payload.answer }),
    keepalive: true, // FLAG SAKTI UNTUK SAFARI: cegah request dibatalkan saat pindah halaman/minimize app
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error("Failed to submit answer");
    // Mock the axios error structure since react-query onError block might expect it
    (error as any).response = { status: response.status, data: errorData };
    throw error;
  }

  return response.json();
};

export const useSubmitAnswer = ({
  token,
  options,
}: {
  token: string;
  options?: Partial<UseMutationOptions<SubmitAnswerResponse, AxiosError, SubmitAnswerPayload>>;
}) => {
  return useMutation({
    mutationFn: (payload: SubmitAnswerPayload) => SubmitAnswerHandler(payload, token),
    retry: 3,
    retryDelay: 1000,
    ...options,
  });
};
