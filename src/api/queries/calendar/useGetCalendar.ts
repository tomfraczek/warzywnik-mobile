import { restClient } from "@/src/api/axios";
import { useQuery } from "@tanstack/react-query";
import { CalendarResponse, resolveCalendarDays } from "./types";

export type CalendarRange = {
  from: string;
  to: string;
};

const getCalendar = async (range: CalendarRange): Promise<CalendarResponse> => {
  const { data } = await restClient.get("/calendar", {
    params: {
      from: range.from,
      to: range.to,
    },
  });

  return {
    days: resolveCalendarDays(data),
  };
};

export const useGetCalendar = (range: CalendarRange) => {
  return useQuery({
    queryKey: ["calendar", range.from, range.to],
    queryFn: () => getCalendar(range),
    enabled: Boolean(range.from && range.to),
  });
};
