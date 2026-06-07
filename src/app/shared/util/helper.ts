/** Port of utils/helper.js */

export function dateTimeFormatter(utcTime: string | number | Date | null | undefined): string {
  if (!utcTime) return '-';
  try {
    const date = new Date(utcTime);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch (err) {
    console.error('Invalid UTC time:', utcTime, err);
    return '-';
  }
}

export interface ModeStyle {
  text: string;
  border: string;
  bg: string;
}

export const modeStyles: Record<string, ModeStyle> = {
  Simulation: {
    text: 'text-[#51cf66]',
    border: 'border-[#51cf66]',
    bg: 'bg-[rgba(81,207,102,0.1)]',
  },
  Live: {
    text: 'text-blue-400',
    border: 'border-blue-300',
    bg: 'bg-[rgba(0,123,255,0.1)]',
  },
  Maintenance: {
    text: 'text-yellow-500',
    border: 'border-yellow-400',
    bg: 'bg-[rgba(255,193,7,0.15)]',
  },
  'Safety Bypass': {
    text: 'text-red-400',
    border: 'border-red-300',
    bg: 'bg-[rgba(255,0,0,0.12)]',
  },
};
