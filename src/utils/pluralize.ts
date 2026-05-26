/**
 * Returns the correct Polish word form based on the given count.
 *
 * Polish pluralization rules:
 *   - 1         → `one`  (e.g. "pracę")
 *   - 2–4 *     → `few`  (e.g. "prace")  * except 12–14
 *   - 0, 5–21,
 *     12–14, …  → `many` (e.g. "prac")
 *
 * @param one  - form for count === 1         (e.g. "pracę")
 * @param few  - form for count 2–4           (e.g. "prace")
 * @param many - form for count 0, 5+, 12–14 (e.g. "prac")
 * @param count - the numeric value to check
 */
export function pluralize(
  one: string,
  few: string,
  many: string,
  count: number,
): string {
  const abs = Math.abs(count);
  if (abs === 1) return one;
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20))
    return few;
  return many;
}
