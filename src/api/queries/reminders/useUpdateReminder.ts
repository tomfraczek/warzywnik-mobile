import { restClient } from "@/src/api/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reminderKeys } from "./reminderKeys";
import { Reminder, UpdateReminderDto } from "./types";

const updateReminder = async (
  id: string,
  payload: UpdateReminderDto,
): Promise<Reminder> => {
  const { data } = await restClient.patch(`/reminders/${id}`, payload);
  return data;
};

export const useUpdateReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReminderDto }) =>
      updateReminder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reminderKeys.all });
    },
  });
};
