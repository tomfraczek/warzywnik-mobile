import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bedKeys } from "./bedKeys";
import { Bed, UpdateBedDto } from "./types";

const updateBed = async ({
  id,
  payload,
}: {
  id: string;
  payload: UpdateBedDto;
}): Promise<Bed> => {
  const { data } = await restClient.patch(`/beds/${id}`, payload);
  return data;
};

export const useUpdateBed = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBedDto) => updateBed({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bedKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: bedKeys.all });
    },
  });
};
