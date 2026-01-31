const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD 
const timePattern = /^\d{2}:\d{2}$/; // HH:mm

export function parseStrToNumber(str: string): number {
  if(datePattern.test(str)) {
    return Date.parse(str); // 2026-01-30 to 1769731200000
  } 

  if(timePattern.test(str)) {
    const [hours, minutes] = str.split(':').map(Number) as [number, number];
    return hours * 3600 + minutes * 60 ; // 20:50 to 75000
  }

  return NaN;
}

