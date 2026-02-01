import si, { mem } from 'systeminformation';

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




const allDataKey = {
    version: "*",
    system: "*",
    bios: "*",
    baseboard: "*",
    chassis: "*",
    os: "*",
    uuid: "*",
    versions: "*",
    cpu: "*",
    graphics: "*",
    net: "*",
    memLayout: "*",
    diskLayout: "*",
    blockDevices: "*",
    usb: "*", 
    time: "*", 
    node: "*", 
    v8: "*", 
    cpuCurrentSpeed: "*", 
    battery: "*", 
    services: "*", 
    wifiNetworks: "*", 
    currentLoad: "*", 
    mem: "*", 
    networkConnections: "*", 
    fsSize: "*", 
    disksIO: "*", 
    networkStats: "*", 
    users: "*", 
    fsStats: "*", 
    temp: "*", 
    processes: "*", 
    inetLatency: "*"
};


const test3 = await si.get({
    "fsOpenFiles": "*"
});

console.log(test3);


(async () => {
    // Measure si.get(allDataKey)
    console.time("si.get(allDataKey)");
    const test2 = await si.get(allDataKey);
    console.timeEnd("si.get(allDataKey)");

    // Measure si.getAllData()
    console.time("si.getAllData");
    const allData = await si.getAllData();
    console.timeEnd("si.getAllData");
})();
