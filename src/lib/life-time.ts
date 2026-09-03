/**
 * Calendar-accurate elapsed-time math for the Life Counter
 * and Circle of Life. Pure functions — reusable in later phases.
 */

export interface LifeTime {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

export function parseBirthInstant(dateOfBirth: string, birthTime?: string): Date {
  return new Date(`${dateOfBirth}T${birthTime ?? "00:00"}:00`);
}

export function computeLifeTime(birth: Date, now: Date): LifeTime {
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // Days in the month preceding `now`.
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const msLived = now.getTime() - birth.getTime();
  const totalDays = Math.floor(msLived / 86_400_000);

  let hours = now.getHours() - birth.getHours();
  let minutes = now.getMinutes() - birth.getMinutes();
  let seconds = now.getSeconds() - birth.getSeconds();
  if (seconds < 0) {
    minutes -= 1;
    seconds += 60;
  }
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  if (hours < 0) {
    days = Math.max(0, days - 1);
    hours += 24;
  }

  return { years, months, days, hours, minutes, seconds, totalDays };
}

/** Circle of Life Level-0 bands: eight 15-year arcs from birth to 105+. */
export const CIRCLE_BANDS = [
  "0–15",
  "15–30",
  "30–45",
  "45–60",
  "60–75",
  "75–90",
  "90–105",
  "105+",
] as const;

export function currentBandIndex(ageYears: number): number {
  return Math.min(Math.floor(ageYears / 15), CIRCLE_BANDS.length - 1);
}
