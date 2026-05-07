import { getResponseError } from "@/src/api/axios";
import {
  WeatherDayItem,
  WeatherHourlyItem,
} from "@/src/api/queries/users/meTypes";
import { useGetMyWeather } from "@/src/api/queries/users/useGetMyWeather";
import { Screen } from "@/src/components/Screen";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useSettings } from "@/src/context/SettingsProvider";
import { radius, spacing } from "@/src/theme/ui";
import {
  formatTemperature,
  getWeatherIconName,
  resolveWeatherLabel,
} from "@/src/utils/weather";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { isAxiosError } from "axios";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  MD3Theme,
  Text,
  useTheme,
} from "react-native-paper";

const formatHour = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${String(date.getHours()).padStart(2, "0")}:00`;
};

const formatDateLabel = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pl-PL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
};

const isWeatherMissingLocationError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 404 || status === 422;
};

const isWeatherUnavailableError = (error: unknown) => {
  if (!isAxiosError(error)) return false;
  return error.response?.status === 503;
};

function HourlyRow({ item }: { item: WeatherHourlyItem }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <View style={styles.hourCard}>
      <Text style={styles.hourTime}>{formatHour(item.time)}</Text>

      <View style={styles.hourCenter}>
        <MaterialCommunityIcons
          name={getWeatherIconName(item.weatherType, {
            precip: item.precip,
            rain: item.rain,
            snow: item.snow,
            isDay: item.isDay,
          })}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.hourLabel}>
          {resolveWeatherLabel(item.weatherLabel, item.weatherType, {
            precip: item.precip,
            rain: item.rain,
            snow: item.snow,
            isDay: item.isDay,
          })}
        </Text>
      </View>

      <View style={styles.hourRight}>
        <Text style={styles.hourTemp}>{formatTemperature(item.temp)}°</Text>
        <Text style={styles.hourMeta}>
          {item.windSpeed} km/h • {item.precip} mm
        </Text>
      </View>
    </View>
  );
}

function NextDayCard({ item }: { item: WeatherDayItem }) {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);

  return (
    <Card>
      <View style={styles.nextDayRow}>
        <View style={styles.nextDayLeft}>
          <Text style={styles.nextDayDate}>{formatDateLabel(item.date)}</Text>
          <Text style={styles.nextDayTemp}>
            {formatTemperature(item.tempMin)}° /{" "}
            {formatTemperature(item.tempMax)}°
          </Text>
        </View>

        <View style={styles.nextDayRight}>
          <MaterialCommunityIcons
            name={getWeatherIconName(item.weatherType, {
              precip: item.precipSum,
            })}
            size={22}
            color={theme.colors.primary}
          />
          <Text style={styles.nextDayLabel}>
            {resolveWeatherLabel(item.weatherLabel, item.weatherType, {
              precip: item.precipSum,
            })}
          </Text>
          <Text style={styles.nextDayMeta}>
            Wiatr {item.windMax} km/h • {item.precipSum} mm
          </Text>
        </View>
      </View>
    </Card>
  );
}

export default function HomeWeatherScreen() {
  const theme = useTheme<MD3Theme>();
  const styles = makeStyles(theme);
  const { location } = useSettings();

  const { data, isLoading, isError, error, refetch } = useGetMyWeather();

  const currentHour = new Date().getHours();
  const upcomingHourlyToday = data?.hourlyToday.filter((hour) => {
    const parsed = new Date(hour.time);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getHours() > currentHour;
    }

    const match = hour.time.match(/T(\d{2}):/);
    if (match) {
      return Number(match[1]) > currentHour;
    }

    return true;
  });

  if (isLoading) {
    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    const localLocationLabel = location?.label ?? null;

    return (
      <Screen safeAreaEdges={["top", "left", "right"]}>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {isWeatherMissingLocationError(error)
              ? "Brak ustawionej lokalizacji."
              : isWeatherUnavailableError(error)
                ? "Pogoda chwilowo niedostępna."
                : String(getResponseError(error))}
          </Text>
          {isWeatherMissingLocationError(error) && localLocationLabel ? (
            <Text style={styles.hintText}>
              Lokalnie masz ustawione: {localLocationLabel}. Serwer nie ma tej
              lokalizacji dla bieżącego konta.
            </Text>
          ) : null}
          <Button mode="outlined" onPress={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {data.stale && (
            <StatusBadge label="Dane chwilowo nieaktualne" tone="warning" />
          )}
        </View>

        {/* TERAZ */}
        <Card title="Teraz">
          <Text style={styles.subtitle}>{data.location.label}</Text>
          <View style={styles.currentRow}>
            <View>
              <Text style={styles.currentTemp}>
                {formatTemperature(data.current.temp)}°
              </Text>
              <Text style={styles.currentLabel}>
                {resolveWeatherLabel(
                  data.current.weatherLabel,
                  data.current.weatherType,
                  {
                    precip: data.current.precip,
                    rain: data.current.rain,
                    snow: data.current.snow,
                    isDay: data.current.isDay,
                  },
                )}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={getWeatherIconName(data.current.weatherType, {
                precip: data.current.precip,
                rain: data.current.rain,
                snow: data.current.snow,
                isDay: data.current.isDay,
              })}
              size={36}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.currentGrid}>
            <Text style={styles.metaItem}>
              Min: {formatTemperature(data.today.tempMin)}°
            </Text>
            <Text style={styles.metaItem}>
              Max: {formatTemperature(data.today.tempMax)}°
            </Text>
            <Text style={styles.metaItem}>
              Wiatr: {data.current.windSpeed} km/h
            </Text>
            <Text style={styles.metaItem}>Opad: {data.current.precip} mm</Text>
          </View>
        </Card>

        {/* GODZINOWO */}
        <Card title="Godzinowo dziś">
          <View style={styles.hourList}>
            {(upcomingHourlyToday ?? []).length > 0 ? (
              (upcomingHourlyToday ?? []).map((hour) => (
                <HourlyRow key={hour.time} item={hour} />
              ))
            ) : (
              <Text style={styles.hourEmptyText}>
                Brak kolejnych godzin na dziś.
              </Text>
            )}
          </View>
        </Card>

        {/* KOLEJNE DNI */}
        <View style={styles.nextDaysSection}>
          <Text style={styles.sectionTitle}>Kolejne dni</Text>
          {data.nextDays.map((day) => (
            <NextDayCard key={day.date} item={day} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const makeStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      gap: spacing.sm,
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: "center",
    },
    hintText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      textTransform: "capitalize",
    },

    /* TERAZ */
    currentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    currentTemp: {
      fontSize: 40,
      fontWeight: "700",
      color: theme.colors.onSurface,
    },
    currentLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    currentGrid: {
      marginTop: spacing.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    metaItem: {
      width: "48%",
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },

    /* GODZINOWO */
    hourList: {
      gap: spacing.sm,
    },
    hourEmptyText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    hourCard: {
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: theme.colors.surfaceVariant,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    hourTime: {
      fontSize: 13,
      fontWeight: "700",
      width: 50,
    },
    hourCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hourLabel: {
      fontSize: 12,
      flexShrink: 1,
    },
    hourRight: {
      alignItems: "flex-end",
    },
    hourTemp: {
      fontSize: 14,
      fontWeight: "700",
    },
    hourMeta: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },

    /* NEXT DAYS */
    nextDaysSection: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.colors.onBackground,
    },
    nextDayRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    nextDayLeft: {
      gap: 4,
    },
    nextDayDate: {
      fontSize: 14,
      fontWeight: "700",
    },
    nextDayTemp: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    nextDayRight: {
      alignItems: "flex-end",
      gap: 2,
    },
    nextDayLabel: {
      fontSize: 12,
    },
    nextDayMeta: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
  });
