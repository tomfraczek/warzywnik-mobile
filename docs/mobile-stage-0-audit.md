# Etap 0 — Audyt i fundamenty (frontend)

Data: 4 lutego 2026

## 1) Nawigacja (Expo Router)

**Stan:** Routing jest oparty o Expo Router. Struktura używa grup: `(auth)` dla niezalogowanych i `(tabs)` jako część zalogowana (grupa aplikacji).

**Flow:**

- `app/index.tsx` przekierowuje w zależności od stanu sesji:
  - niezalogowany → `/(auth)` (welcome)
  - zalogowany → `/(tabs)/home`
- `app/_layout.tsx` zawiera dodatkową ochronę segmentów (redirecty na podstawie `useAuth()` + `useSegments()`).

**Decyzja:** zostaje, **minimalna korekta** redirectów i spójność ścieżek.

## 2) Ekran powitalny (Welcome / Auth Entry)

**Stan:** Dodany ekran powitalny `app/(auth)/index.tsx` jako pierwszy ekran dla niezalogowanego użytkownika.

**Wymagania:**

- 2 CTA: „Zaloguj się”, „Zarejestruj się” ✅
- bez pobierania danych z API ✅

**Decyzja:** OK — minimalny ekran zgodny z wymaganiami.

## 3) Clerk — sesja i token

**Token:** JWT pobierany on-demand przez `setAuthTokenProvider()` (token nie jest trzymany globalnie w stanie).

**Requesty:** `Authorization: Bearer <JWT>` dodawane w interceptorze `restClient`.

**Logout:**

- czyszczenie cache React Query (`queryClient.clear()` + `clientPersister.removeClient()`)
- przekierowanie do `/(auth)`

**401/403:**

- interceptor wywołuje handler błędu autoryzacji → `signOut()` + czyszczenie cache + redirect do `/(auth)`.

**Scenariusze:**

- `/auth/whoami` i `/me` po zalogowaniu → requesty z JWT ✅
- brak tokenu → 401/403 → sign out + redirect ✅

## 4) API client

**Źródło prawdy:** jeden klient `restClient` w `src/api/axios.ts`.

**baseURL:** z `EXPO_PUBLIC_API_BASE_URL` (fallback do `http://localhost:3000`).

**Interceptory:**

- auth header (JWT)
- obsługa błędów + 401/403 → globalny handler

**Decyzja:** OK — jedno źródło prawdy, bez duplikacji.

## 5) React Query

**Provider:** `PersistQueryClientProvider` w `app/_layout.tsx`.

**Polityki (mobile-friendly):**

- `refetchOnWindowFocus: false`
- `staleTime: 2 min`
- `retry: 2` z krótkim `retryDelay`

**Logout:** czyszczenie cache i persystencji.

## 6) Typy, daty, DTO

**Stan:** Daty w DTO są traktowane jako ISO string (`createdAt`, `updatedAt`).

**Wysyłka dat:** brak użycia obiektów `Date` w requestach.

**Helper dat:** na tym etapie brak potrzeby centralnego helpera.

---

### Podsumowanie

Fundamenty aplikacji są spójne: routing Expo Router, poprawny flow auth, jeden API client z interceptorami, stabilny React Query setup oraz czyszczenie cache po wylogowaniu.
