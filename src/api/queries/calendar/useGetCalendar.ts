import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { CalendarResponse, resolveCalendarResponse } from "./types";

export type CalendarRange = {
  from: string;
  to: string;
};

export type CalendarQueryOptions = {
  includeDoneTasks?: boolean;
  includeReminders?: boolean;
};

const getCalendar = async (
  range: CalendarRange,
  options?: CalendarQueryOptions,
): Promise<CalendarResponse> => {
  const { data } = await restClient.get("/calendar", {
    params: {
      from: range.from,
      to: range.to,
      ...(typeof options?.includeDoneTasks === "boolean"
        ? { includeDoneTasks: options.includeDoneTasks }
        : {}),
      ...(typeof options?.includeReminders === "boolean"
        ? { includeReminders: options.includeReminders }
        : {}),
    },
  });

  return resolveCalendarResponse(data);
};

export const useGetCalendar = (range: CalendarRange) => {
  return useQuery({
    queryKey: ["calendar", range.from, range.to],
    queryFn: () => getCalendar(range),
    enabled: Boolean(range.from && range.to),
  });
};

export const useGetCalendarWithOptions = (
  range: CalendarRange,
  options?: CalendarQueryOptions,
) => {
  return useQuery({
    queryKey: [
      "calendar",
      range.from,
      range.to,
      {
        includeDoneTasks: options?.includeDoneTasks,
        includeReminders: options?.includeReminders,
      },
    ],
    queryFn: () => getCalendar(range, options),
    enabled: Boolean(range.from && range.to),
  });
};
