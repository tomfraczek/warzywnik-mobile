import { NetInfoState } from "@react-native-community/netinfo";

export const OFFLINE_BANNER_TEXT = "Jesteś offline";
export const OFFLINE_MUTATION_MESSAGE =
  "Brak internetu. Zapis jest niedostępny offline.";
export const OFFLINE_NO_DATA_MESSAGE =
  "Brak internetu i brak zapisanych danych.";
// The extra height the banner adds beyond the status bar inset (paddingBottom + text)
export const OFFLINE_BANNER_EXTRA_HEIGHT = 30;

export class OfflineMutationError extends Error {
  constructor(message = OFFLINE_MUTATION_MESSAGE) {
    super(message);
    this.name = "OfflineMutationError";
  }
}

export const isNetworkOnline = (
  state:
    | Pick<NetInfoState, "type" | "isConnected" | "isInternetReachable">
    | null
    | undefined,
) => {
  if (!state) return true;
  if (state.type === "none") return false;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
};

export const isOfflineMutationError = (
  error: unknown,
): error is OfflineMutationError => error instanceof OfflineMutationError;
