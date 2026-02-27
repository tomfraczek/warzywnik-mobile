import { MD3Theme } from "react-native-paper";

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 999,
} as const;

export const cardShadow = {
  shadowColor: "#102016",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};

export const getSeverityTone = (severity?: string) => {
  const normalized = severity?.toLowerCase() ?? "";
  if (normalized.includes("high") || normalized.includes("critical")) {
    return "danger" as const;
  }
  if (normalized.includes("medium") || normalized.includes("warn")) {
    return "warning" as const;
  }
  if (normalized.includes("low") || normalized.includes("info")) {
    return "info" as const;
  }
  return "neutral" as const;
};

export const statusColors = (theme: MD3Theme) => ({
  success: {
    bg: theme.dark ? "#163222" : "#E7F4EC",
    text: theme.dark ? "#9BD7B4" : "#1C5A3D",
  },
  warning: {
    bg: theme.dark ? "#3B2F15" : "#FFF3DA",
    text: theme.dark ? "#F2CD7B" : "#8D6A1B",
  },
  danger: {
    bg: theme.dark ? "#3D1F1D" : "#FCE9E7",
    text: theme.dark ? "#F6A39B" : "#9D372C",
  },
  info: {
    bg: theme.dark ? "#1D2F40" : "#E7F2FA",
    text: theme.dark ? "#A9CCE6" : "#245A82",
  },
  neutral: {
    bg: theme.colors.surfaceVariant,
    text: theme.colors.onSurfaceVariant,
  },
});
