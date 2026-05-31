import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(raw: string) {
  // Display helper for tel: numbers
  return raw.replace(/[^0-9+]/g, "");
}
