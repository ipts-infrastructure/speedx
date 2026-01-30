import si from 'systeminformation';


// const baseboard : Record<string, any> = await si.baseboard();
// const manufacturer = baseboard.manufacturer;
// console.log(typeof manufacturer)


const cache : Record<string, any> = await si.cpuCache();

// console.log(cache)

// const currentSpeed = await si.cpuCurrentSpeed();

// console.log(currentSpeed.avg)
// console.log(currentSpeed.min)
// console.log(currentSpeed.max)

// const shell = await si.shell();

// console.log(shell)


// const disksio = await si.disksIO();

// console.log(disksio.rIO_sec)
// console.log(disksio.wIO_sec)
// console.log(disksio.tIO_sec)


// const processes = await si.processes();


const memLayout = await si.memLayout();

function check(){
    console.log( memLayout);
}

check()