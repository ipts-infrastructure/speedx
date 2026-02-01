import si from 'systeminformation';

// async function run() {
//   // Capture CPU load before
//   const loadBefore = await si.currentLoad();

//   const t1 = performance.now();
//   const allData = await si.getAllData();
//   const t2 = performance.now();

//   // Capture CPU load after
//   const loadAfter = await si.currentLoad();

//   console.log(`Call to getAllData took ${(t2 - t1).toFixed(2)} ms`);

//   console.log("CPU usage before:", loadBefore.currentLoad.toFixed(2) + "%");
//   console.log("CPU usage after:", loadAfter.currentLoad.toFixed(2) + "%");
// }
// run();

const test = await si.getAllData();
console.log(test.disksIO);