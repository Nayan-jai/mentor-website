import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, utcToZonedTime } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats a date in a specific timezone (default: Asia/Kolkata)
export function formatSessionTime(date: Date, timeZone: string = 'Asia/Kolkata') {
  const zonedDate = utcToZonedTime(date, timeZone);
  // Example: June 26, 2024, 10:00 AM IST
  return format(zonedDate, "MMMM d, yyyy, hh:mm a zzz", { timeZone });
} 