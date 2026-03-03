import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "./bedKeys";
import { Bed, CreateBedDto } from "./types";

const createBed = async (payload: CreateBedDto): Promise<Bed> => {
  const { data } = await restClient.post("/beds", payload);
  return data;
};

export const useCreateBed = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bedKeys.all });
      queryClient.invalidateQueries({ queryKey: ["me", "warnings"] });
      queryClient.invalidateQueries({ queryKey: ["me", "tasks"] });
    },
  });
};
