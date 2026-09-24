export const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, null] as const;

export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateOutliers(votes: (number | null)[]): Set<number> {
  const numeric = votes
    .map((v, i) => ({ value: v, index: i }))
    .filter((item): item is { value: number; index: number } => item.value !== null);

  if (numeric.length <= 2) return new Set();

  const mean = numeric.reduce((sum, item) => sum + item.value, 0) / numeric.length;
  const variance =
    numeric.reduce((sum, item) => sum + Math.pow(item.value - mean, 2), 0) /
    numeric.length;
  const stdDev = Math.sqrt(variance);

  // Minimum stdDev threshold to avoid flagging all values as outliers when they're close
  const minStdDev = 0.5;
  const effectiveStdDev = Math.max(stdDev, minStdDev);

  const outliers = new Set<number>();
  numeric.forEach((item) => {
    if (Math.abs(item.value - mean) > effectiveStdDev) {
      outliers.add(item.index);
    }
  });

  return outliers;
}
