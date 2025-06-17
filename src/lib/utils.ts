import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(str:any) {
  return str.replace(/^\w/, (c:any) => c.toUpperCase());
}

export const formatDateInNepaliTimezone = (dateString: string, showTime: boolean = true) => {
  // First convert to UTC to ensure consistent handling
  const utcDate = new Date(dateString);

  // Define formatting options
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // "Thu"
    year: 'numeric',  // "2025"
    month: 'short',   // "Mar"
    day: 'numeric',   // "27"
    timeZone: 'Asia/Kathmandu',
  };

  if (showTime) {
    Object.assign(dateOptions, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true, // Show AM/PM format
    });
  }

  // Format date based on options
  return utcDate.toLocaleString('en', dateOptions);
};

