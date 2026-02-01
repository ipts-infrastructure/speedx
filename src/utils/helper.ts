import { logger } from '../utils/logger';

const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD 
const timePattern = /^\d{2}:\d{2}$/; // HH:mm
const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/; // YYYY-MM-DD HH:mm:ss

const PROCESSES_STATUS_MAP: Record<string, number> = {
  running: 1,
  sleeping: 2,
  waiting: 3,
  zombie: 4,
  stopped: 5,
  paging: 6,
  unknown: 7
};

const OPERSTATE_STATUS_MAP: Record<string, number> = {
  up: 1,
  down: 0,
  unknown: 2
};

const NETWORK_CONNECTION_STATE:  Record<string, number> = {
  established: 1,
  syn_sent: 2,
  syn_recv: 3,
  fin_wait1: 4,
  fin_wait2: 5,
  time_wait: 6,
  close: 7,
  close_wait: 8,
  last_ack: 9,
  listen: 10,
  close_req: 11,
  none: 12
}

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

  if (s in OPERSTATE_STATUS_MAP){
    return OPERSTATE_STATUS_MAP[s] as number;
  }

  if (s in NETWORK_CONNECTION_STATE){
    return NETWORK_CONNECTION_STATE[s] as number;
  }

  return NaN;
}


