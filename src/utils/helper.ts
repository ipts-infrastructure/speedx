import { logger } from '../utils/logger';

const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD 
const timePattern = /^\d{2}:\d{2}$/; // HH:mm
const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/; // YYYY-MM-DD HH:mm:ss

const PROCESSES_STATUS_MAP: Record<string, number> = {
  running: 1,
  blocked: 2,
  sleeping: 3,
  zombie: 4
};

export function parseStrToNumber(str: string): number {

  const s = str.toLowerCase();

  if (dateTimePattern.test(s)) {
    return Date.parse(s); // 2026-01-30 20:50:00 to 1769819400000
  }

  if (datePattern.test(s)) {
    return Date.parse(s); // 2026-01-30 to 1769731200000
  }

  if (timePattern.test(s)) {
    const [hours, minutes] = s.split(':').map(Number) as [number, number];
    return hours * 3600 + minutes * 60; // 20:50 to 75000
  }

  if (s in PROCESSES_STATUS_MAP) {
    return PROCESSES_STATUS_MAP[s] as number;
  }

  return NaN;
}


