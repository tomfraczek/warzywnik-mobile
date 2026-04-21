import { restClient } from "@/src/api/axios";
import { useMutation } from "@tanstack/react-query";
import { AnalyticsEvent, TrackEventsResponse } from "./types";

const trackEvents = async (
  events: AnalyticsEvent[],
): Promise<TrackEventsResponse> => {
  const { data } = await restClient.post<TrackEventsResponse>(
    "/analytics/events",
    { events },
  );
  return data;
};

export const useTrackAnalyticsEvents = () => {
  return useMutation({
    mutationFn: (events: AnalyticsEvent[]) => trackEvents(events),
    onError: (err) => {
      if (__DEV__) {
        console.warn("Analytics tracking error:", err);
      }
    },
  });
};
