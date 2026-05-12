import { restClient } from "@/src/api/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export type MeResponse = {
  id?: string;
  automaticTasksEnabled?: boolean;
  [key: string]: unknown;
};

type UpdateMePayload = {
  automaticTasksEnabled: boolean;
};

const isNotFound = (error: unknown) => {
  const axiosError = error as AxiosError;
  return axiosError?.response?.status === 404;
};

const getMe = async (): Promise<MeResponse> => {
  try {
    const { data } = await restClient.get<MeResponse>("/me");
    return data;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const { data } = await restClient.get<MeResponse>("/users/me");
    return data;
  }
};

export const updateMe = async (
  payload: UpdateMePayload,
): Promise<MeResponse> => {
  try {
    const { data } = await restClient.patch<MeResponse>("/me", payload);
    return data;
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const { data } = await restClient.patch<MeResponse>("/users/me", payload);
    return data;
  }
};

export const useMe = () => {
  return useQuery({
    queryKey: ["me", "profile"],
    queryFn: getMe,
  });
};

export const useUpdateMe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["me", "profile"] }),
        queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
      ]);
    },
  });
};
