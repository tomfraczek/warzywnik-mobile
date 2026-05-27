import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";

export type CreateVegetableSuggestionDto = {
  name: string;
  note?: string | null;
};

export type VegetableSuggestion = {
  id: string;
  name: string;
  note: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

const createVegetableSuggestion = async (
  payload: CreateVegetableSuggestionDto,
): Promise<VegetableSuggestion> => {
  const { data } = await restClient.post("/vegetable-suggestions", payload);
  return data;
};

export const useCreateVegetableSuggestion = () =>
  useMutation({
    mutationFn: createVegetableSuggestion,
  });
