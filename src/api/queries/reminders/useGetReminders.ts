import { restClient } from "@/src/api/axios";
import { parsePaginatedResponse } from "@/src/api/queries/pagination";
import { useQuery } from "@tanstack/react-query";
import { reminderKeys } from "./reminderKeys";
import { Reminder, ReminderListParams } from "./types";

const getReminders = async (
  params: ReminderListParams,
): Promise<Reminder[]> => {
  const { data } = await restClient.get("/reminders", {
    params: {
      status: params.status ?? "pending",
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    },
  });
  return parsePaginatedResponse<Reminder>(
    data,
    params.page ?? 1,
    params.limit ?? 50,
  ).items;
};

export const useGetReminders = (params: ReminderListParams = {}) => {
  return useQuery({
    queryKey: reminderKeys.list(params),
    queryFn: () => getReminders(params),
  });
};
