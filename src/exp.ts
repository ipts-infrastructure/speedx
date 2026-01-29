import si from 'systeminformation';


// const baseboard : Record<string, any> = await si.baseboard();
// const manufacturer = baseboard.manufacturer;
// console.log(typeof manufacturer)


const cache : Record<string, any> = await si.cpuCache();

console.log(cache)

const currentSpeed = await si.cpuCurrentSpeed();

console.log(currentSpeed.avg)
console.log(currentSpeed.min)
console.log(currentSpeed.max)