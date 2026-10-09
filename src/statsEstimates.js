// Pre-tracking estimates for the Baby Fair kiosk (before quiz_events logging went live).
// Source: Supabase API gateway logs — GET /rest/v1/questions requests from the StanbyME 2 TV
// (LG NetCast user agent). The quiz fetches questions once on "시작하기" and once on returning
// home, so one game ≈ two requests. Values below are raw request counts per KST hour;
// the admin divides by two. These are approximate game STARTS, not confirmed result views.

export const ESTIMATE_SNAPSHOT_AT = '2026-10-09 10:59';

export const estimatedRequestsByHour = {
  '2026-10-08': { 8: 1, 9: 8, 10: 84, 11: 75, 12: 61, 13: 50, 14: 34, 15: 32, 16: 32, 17: 4 },
  '2026-10-09': { 9: 3, 10: 55 },
};

export function estimateDays() {
  return Object.entries(estimatedRequestsByHour).map(([date, hours]) => {
    const entries = Object.entries(hours).map(([h, n]) => [Number(h), n]);
    const totalReq = entries.reduce((s, [, n]) => s + n, 0);
    const amReq = entries.filter(([h]) => h < 12).reduce((s, [, n]) => s + n, 0);
    const total = Math.round(totalReq / 2);
    const am = Math.round(amReq / 2);
    return {
      date,
      am,
      pm: total - am,
      total,
      hours: Object.fromEntries(entries.map(([h, n]) => [h, Math.round(n / 2)])),
    };
  });
}
