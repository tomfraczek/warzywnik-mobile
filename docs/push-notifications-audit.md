# Audyt obsługi powiadomień — wyniki

---

## 1. Rejestracja push tokena

**Pliki:** `src/features/push/usePushNotificationsLifecycle.ts`, `src/features/push/push.ts`

**Stan:**

- Token jest pobierany przez `getExpoToken()` i rejestrowany przez `useRegisterDevice` — ✅
- Rejestracja odpala się reaktywnie na zmianę `isSignedIn` i `notificationsEnabled` — ✅
- Po wylogowaniu: `clearStoredPushRegistration()` czyści stan lokalny, `disableCurrentDevice()` odpala `useDisableDevice` — ✅
- Deduplication tokena przez `lastRegisteredTokenRef` i porównanie ze `storedPushToken` zapobiega ponownej rejestracji tego samego tokena — ✅
- Listener `addPushTokenListener` rejestruje nowy token jeśli zmieni się w trakcie sesji — ✅

**Ryzyko:**

- ⚠️ `clearStoredPushRegistration()` jest wołane tylko na logout, ale `disableCurrentDevice()` wymaga wcześniejszego `getStoredDeviceId()`. Jeśli `disableDevice` się nie powiedzie (np. brak sieci), token może zostać przypisany do starego usera. Nie ma retry/kolejki. Jest to istniejące ryzyko, niezwiązane z backendowym refactorem.
- ✅ Brak ryzyka przypisania tokena do starego użytkownika przy poprawnym działaniu.

---

## 2. Obsługa kliknięcia w push

**Pliki:** `src/features/push/parsePushNotificationPayload.ts`, `src/features/push/handlePushNotificationResponse.ts`, `src/features/push/getPushNotificationRoute.ts`

**Stan:**

- Parser obsługuje `actionTaskIds`, `bedIds`, `plantingIds` jako tablice — ✅ (już są w typach i parserze)
- **Problem krytyczny:** `getPushNotificationRoute.ts` ignoruje `bedIds[]` / `plantingIds[]` i używa `resolvePayloadBedId` / `resolvePayloadPlantingId`, które zwracają **tylko jeden identyfikator** — ❌

```typescript
// resolvePayloadPlantingId — zwraca pierwszy element z affectedPlantingIds
// Nowe pola plantingIds[] są całkowicie zignorowane w logice routingu
```

- Dla `BED_DETAIL` z payload zawierającym `bedIds: ["b-1","b-2","b-3"]` — router użyje `payload.bedId` (dla kompatybilności) lub `ownerScopeId`, a jeśli backend je poda, trafi do **pierwszego** losowego beda — ❌
- Dla `PLANTING_DETAIL` — analogicznie, `plantingIds[]` są ignorowane, router bierze `plantingId` lub `affectedPlantingIds[0]` — ❌
- `userIntentKey` jest całkowicie pominięty w routingu — ❌

---

## 3. Routing dla agregowanych powiadomień

**Plik:** `src/features/push/getPushNotificationRoute.ts`

Aktualne mapowanie `routeTarget` → ekran:

| `routeTarget`     | Obecny routing                                                              | Problem                                             |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `PLANNER`         | `/(tabs)/planner`                                                           | ✅ poprawny dla `WATERING_TODAY`, `TASKS_DUE_TODAY` |
| `PLANNER_TASKS`   | `/(tabs)/planner/tasks`                                                     | ✅ poprawny                                         |
| `PLANTING_DETAIL` | `/plantings/[plantingId]` lub `/(tabs)/beds/[bedId]/plantings/[plantingId]` | ❌ bierze tylko jeden ID                            |
| `BED_DETAIL`      | `/(tabs)/beds/[bedId]`                                                      | ❌ bierze tylko jeden ID                            |
| `WEATHER`         | `/(tabs)/home/weather`                                                      | ✅                                                  |
| `GARDEN_RISK`     | `/(tabs)/home/garden-risk`                                                  | ✅                                                  |
| `WEATHER_ALERTS`  | `/(tabs)/home/warnings`                                                     | ✅                                                  |

**Główne ryzyko:** Backend dla `HARVEST_READY` i `LIFECYCLE_HARVEST` może wysłać `routeTarget: "PLANTING_DETAIL"` z `plantingIds: ["p-1","p-2","p-3"]` i `plantingId: "p-1"` dla kompatybilności. Frontend trafi do `p-1` — losowej pierwszej uprawy zamiast Plannera/listy zadań.

Poprawne mapowanie dla agregowanych pushy powinno opierać się na `userIntentKey`:

| `userIntentKey`       | Oczekiwany routing                            |
| --------------------- | --------------------------------------------- |
| `WATERING_TODAY`      | `/(tabs)/planner` lub `/(tabs)/planner/tasks` |
| `HARVEST_READY`       | `/(tabs)/planner/tasks`                       |
| `TASKS_DUE_TODAY`     | `/(tabs)/planner`                             |
| `LIFECYCLE_HARVEST`   | `/(tabs)/planner/tasks`                       |
| `WEATHER_ALERTS`      | `/(tabs)/home/warnings`                       |
| `GARDEN_RISK_DROUGHT` | `/(tabs)/home/garden-risk`                    |

---

## 4. Notification Center

**Plik:** `src/app/notifications/index.tsx`

**Stan:**

- Renderuje `item.title`, `item.body`, `item.createdAt`, `item.status` — ✅
- `item.payload` jest przekazywany do `getPushNotificationRoute(item.payload)` przy kliknięciu — oznacza to, że **ten sam błąd routingu jak przy kliknięciu w push** dotyczy też Notification Center — ❌
- `userIntentKey`, `count`, `actionTaskIds`, `bedIds`, `plantingIds` nie są renderowane — ✅ (nie powoduje błędów)
- Brak wyświetlenia liczby (`count`) w stylu „3 grządki wymagają uwagi" — ❌ UX gap
- `NotificationItem.payload` używa typu `PushNotificationPayload` — `userIntentKey`, `count`, `deliveryPolicy` **nie są w typie** — ❌

---

## 5. Typy TypeScript

**Plik:** `src/features/push/types.ts`

**Co jest już w typach:**

- `actionTaskIds?: string[]` — ✅
- `bedIds?: string[]` — ✅
- `plantingIds?: string[]` — ✅
- `affectedPlantingIds?: string[]` — ✅

**Czego brakuje w `PushNotificationPayload`:**

- `userIntentKey?: string` — ❌ brak
- `count?: number` — ❌ brak
- `deliveryPolicy?: 'PUSH_IMMEDIATE' | 'PUSH_DIGEST' | 'CENTER_ONLY' | 'PLAN_ONLY'` — ❌ brak

**Czego brakuje w parserze (`parsePushNotificationPayload.ts`):**

- Parsowanie `userIntentKey` — ❌
- Parsowanie `count` — ❌
- Parsowanie `deliveryPolicy` — ❌

**`NotificationType` — potencjalny problem:**
Obecne wartości to `TASKS_GENERATED`, `DAILY_TASKS_SUMMARY`, itd. Jeśli backend po refactorze może wysyłać nowe typy (np. `WATERING_TODAY`, `HARVEST_READY`), parser odrzuci je (`isValid: false`) i routing wróci do home — ❌ **krytyczne**.

---

## 6. UI/UX

**Plik:** `src/app/notifications/index.tsx`

Obecny widok karty powiadomienia wyświetla:

- tytuł (`item.title`) — ✅ backend powinien wysłać gotowy string, np. „Podlewanie roślin"
- treść (`item.body`) — ✅ backend powinien wysłać „3 grządki wymagają uwagi"
- priorytet, data — ✅

**Problem:** Brak wizualnego wskaźnika **agregacji** (np. badge z `count`, ikona multi-elementu). Jeśli backend wypełni `title` i `body` gotowymi stringami, UI wyświetli poprawnie. Jednak:

- Nie ma możliwości wyświetlenia dynamicznego `count` niezależnie od body — ❌ (minor UX)
- Kliknięcie w agregowany wpis prowadzi do `getPushNotificationRoute` z tym samym problemem routingu — ❌

---

## 7. Ryzyko regresji

| Scenariusz                                                         | Ryzyko                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Kliknięcie w stare powiadomienia (pojedyncze `bedId`/`plantingId`) | ✅ brak regresji — kod kompatybilny wstecz                       |
| Routing do pojedynczej uprawy                                      | ✅ działa przez `plantingId` / `ownerScopeId`                    |
| Routing do grządki                                                 | ✅ działa przez `bedId` / `ownerScopeId`                         |
| Routing do artykułu                                                | ✅ działa przez `articleId` / `articleSlug`                      |
| Routing do pogody / alertów / ryzyka ogrodu                        | ✅ działa (target-based)                                         |
| Foreground snackbar/haptics                                        | ✅ nie zależy od nowych pól                                      |
| Badge/unread count                                                 | ✅ oparty na `NotificationsSummary`, niezależny                  |
| Nowe typy powiadomień w `type`                                     | ❌ parser odrzuci nieznane typy → fallback do home               |
| Agregowany push → routing do pierwszego elementu listy             | ❌ jeśli backend podaje `bedId`/`plantingId` dla kompatybilności |

---

## 8. Podsumowanie i minimalny plan implementacji

### Czy frontend wymaga zmian? **TAK**

### Pliki wymagające zmian:

1. `src/features/push/types.ts` — dodać `userIntentKey`, `count`, `deliveryPolicy`; rozszerzyć `NotificationType` o nowe wartości
2. `src/features/push/parsePushNotificationPayload.ts` — parsować `userIntentKey`, `count`, `deliveryPolicy`; zaktualizować listę `NOTIFICATION_TYPES`
3. `src/features/push/getPushNotificationRoute.ts` — **krytyczne** — dodać logikę dla `userIntentKey` przed fallbackiem na `routeTarget`; agregowane pushe nie powinny trafiać do pojedynczego `bedId`/`plantingId`
4. `src/features/push/getPushNotificationRoute.test.ts` — dodać testy dla agregowanych pushy

### Które zmiany są krytyczne przed release?

| Zmiana                                                 | Krytyczność                                                      |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Rozszerzenie `NotificationType` o nowe typy z backendu | **KRYTYCZNA** — parser odrzuca nieznany `type`, push nie routuje |
| Dodanie `userIntentKey` do typów i parsera             | **KRYTYCZNA** — bez tego nie można naprawić routingu             |
| Routing przez `userIntentKey` dla agregowanych pushy   | **KRYTYCZNA** — agregowany push trafia do losowej grządki/uprawy |
| Dodanie `count` i `deliveryPolicy`                     | Niskopriorytetowa                                                |
| UX dla `count` w Notification Center                   | Niskopriorytetowa                                                |

### Jak powinien wyglądać routing dla agregowanych pushy?

W `getPushNotificationRoute` należy dodać warstwę **przed** switch na `routeTarget`:

```typescript
// Pseudokod logiki priorytetowej
if (payload.userIntentKey) {
  switch (payload.userIntentKey) {
    case "WATERING_TODAY":
    case "TASKS_DUE_TODAY":
      return "/(tabs)/planner";
    case "HARVEST_READY":
    case "LIFECYCLE_HARVEST":
      return "/(tabs)/planner/tasks";
    case "WEATHER_ALERTS":
      return "/(tabs)/home/warnings";
    case "GARDEN_RISK_DROUGHT":
      return "/(tabs)/home/garden-risk";
  }
}
// następnie istniejący switch na routeTarget
```

### Czy Notification Center wymaga zmian?

- Rendering tytułu i treści — **nie wymaga** (zależy od backend stringów)
- Routing po kliknięciu — **wymaga** (ten sam co push, naprawiony przez `getPushNotificationRoute`)
- Wyświetlenie `count` — opcjonalne, minor UX

### Rejestracja push tokena — czy działa poprawnie?

✅ Tak — mechanizm rejestracji/deaktywacji działa poprawnie dla typowych scenariuszy login/logout. Jedyne ryzyko (brak sieci przy logout) jest niezwiązane z backendowym refactorem.
