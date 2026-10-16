export function isValidEventWindow(startAt: string | Date, endAt: string | Date): boolean {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();

  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}
