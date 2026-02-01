


// date: "2026-01-30",
// time: "20:50"
const testCase: string = "2026-01-30";
const testCase2: string = "20:50";


function extractNumbers(str: string): number {
  // Remove all non-digit characters
  const digitsOnly = str.replace(/\D/g, "");
  
  // Convert to number
  return digitsOnly.length > 0 ? Number(digitsOnly) : NaN;
}

// Examples
console.log(extractNumbers(testCase));   // 123
console.log(extractNumbers(testCase2)); // 4567 (decimal removed)

import si from 'systeminformation';

const data = await si.processes();
console.log("--")
console.error(data.list[0]);


const data2 = await si.fsStats();
console.log("--")
console.log(data2)