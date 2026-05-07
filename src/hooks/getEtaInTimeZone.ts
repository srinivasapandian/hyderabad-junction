export function getEtaInTimeZone(
  timeZone: string | undefined,
  etaMinutes = 0,
): { etaDate: string; etaTime: string } {
  const tz =
    timeZone && Intl.supportedValuesOf?.('timeZone').includes(timeZone)
      ? timeZone
      : undefined;

  // Offset now by the branch's configured ETA duration
  const now = Date.now() + etaMinutes * 60 * 1000;

  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { ...(tz ? { timeZone: tz } : {}), ...opts }).formatToParts(now);

  const dp = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
  const etaDate = [
    dp.find((p) => p.type === 'year')?.value,
    dp.find((p) => p.type === 'month')?.value,
    dp.find((p) => p.type === 'day')?.value,
  ].join('-');

  const tp = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const etaTime = [
    tp.find((p) => p.type === 'hour')?.value,
    tp.find((p) => p.type === 'minute')?.value,
    tp.find((p) => p.type === 'second')?.value,
  ].join(':');

  return { etaDate, etaTime };
}
