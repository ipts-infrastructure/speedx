
// SYSTEM (HW)
const STATIC_HW_INFO: LabeledMetricConfig = {
    metricName: 'machine_hw_info',
    description: 'Static Hardware information',
    labelKeys: ['version', 'serial', 'uuid'],
    dataFields: ['version', 'serial', 'uuid']
};

const STATIC_BASEBOARD_METRICS: LabeledMetricConfig = {
    metricName: 'machine_baseboard_info',
    description: 'System baseboard information',
    labelKeys: ['manufacturer', 'version', 'serial', 'mem_max', 'mem_slots'],
    dataFields: ['manufacturer', 'version', 'serial', 'memMax', 'memSlots']
};

const STATIC_CHASSIS_METRICS: LabeledMetricConfig = {
    metricName: 'machine_chassis_info',
    description: 'System chassis information',
    labelKeys: ['manufacturer', 'chassis', 'type', 'version'],
    dataFields: ['manufacturer', 'chassis', 'type', 'version']
};

// CPU
export const DYNAMIC_CPU_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_speed', description: 'Current CPU clock speed in GHz', dataField: 'speed' },
    { metricName: 'machine_cpu_speed_min', description: 'Minimum CPU clock speed in GHz', dataField: 'speedMin' },
    { metricName: 'machine_cpu_speed_max', description: 'Maximum CPU clock speed in GHz (turbo)', dataField: 'speedMax' },
    { metricName: 'machine_cpu_virtualization', description: 'Hardware virtualization enabled/disabled', dataField: 'virtualization' }
];

export const STATIC_CPU_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu_info',
    description: 'Static CPU information',
    labelKeys: ['cores', 'physical_cores', 'efficiency_cores', 'performance_cores', 'vendor', 'family', 'model'],
    dataFields: ['cores', 'physicalCores', 'efficiencyCores', 'performanceCores', 'vendor', 'family', 'model']
};

export const STATIC_CPU_CACHE_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu_cache',
    description: 'System cpu cache in bytes',
    labelKeys: ['l1d_size', 'l1i_size', 'l2_size', 'l3_size'],
    dataFields: ['l1d', 'l1i', 'l2', 'l3']
}

export const DYNAMIC_CPU_TEMPERATURE_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_main_temperature', description: 'Main/average CPU package temperature in °C', dataField: 'main' },
    { metricName: 'machine_cpu_max', description: 'Maximum reported CPU temperature in °C', dataField: 'max' }
];

export const DYNAMIC_CPU_CURRENT_SPEED_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_current_speed_avg', description: 'Average CPU speed for all cores', dataField: 'avg' },
    { metricName: 'machine_cpu_current_speed_max', description: 'Max CPU speed for all cores', dataField: 'max' },
    { metricName: 'machine_cpu_current_speed_min', description: 'Min CPU speed for all cores', dataField: 'min' }
];

export const DYNAMIC_CORE_TEMPERATURE_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu',
    description: 'CPU core temperatures in °C',
    labelKeys: ['cores_temperatures'],
    dataFields: ['cores']
};

// MEMORY
export const DYNAMIC_MEMORY_METRICS: MetricConfig[] = [
    { metricName: 'machine_memory_total', description: 'Total physical memory in bytes', dataField: 'total' },
    { metricName: 'machine_memory_free', description: 'Unused memory in bytes', dataField: 'free' },
    { metricName: 'machine_memory_used', description: 'Currently used memory in bytes', dataField: 'used' },
    { metricName: 'machine_memory_active', description: 'Memory actively in use (excluding buffers/cache)', dataField: 'active' },
    { metricName: 'machine_memory_buffcache', description: 'Memory used for buffers and cache', dataField: 'buffcache' },
    { metricName: 'machine_memory_reclaimable', description: 'Cache memory that can be reclaimed', dataField: 'reclaimable' },
    { metricName: 'machine_memory_available', description: 'Memory available for new processes without swapping', dataField: 'available' },
    { metricName: 'machine_memory_swaptotal', description: 'Total swap space in bytes', dataField: 'swaptotal' },
    { metricName: 'machine_memory_swapused', description: 'Swap space currently in use in bytes', dataField: 'swapused' },
    { metricName: 'machine_memory_swapfree', description: 'Unused swap space in bytes', dataField: 'swapfree' }
];

// Battery
export const DYNAMIC_BATTERY_METRICS: MetricConfig[] = [
    { metricName: 'machine_battery_ac_connected', description: 'Ac connected to system', dataField: 'acConnected' },
    { metricName: 'machine_battery_voltage', description: 'Current voltage of battery of system in V', dataField: 'voltage' }
];

// Operating system
export const STATIC_OPEARTING_SYSTEM_METRICS: LabeledMetricConfig = {
    metricName: 'machine_os',
    description: 'System OS information',
    labelKeys: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi'],
    dataFields: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi']
};

export const STATIC_UUID_METRICS: LabeledMetricConfig = {
    metricName: 'machine_uuid',
    description: 'System UUID information',
    labelKeys: ['os', 'hardware', 'macs'],
    dataFields: ['os', 'hardware', 'macs']
};

// Disk IO
export const STATIC_DISKSIO_METRICS: MetricConfig[] = [
    { metricName: 'machine_disksio_rio', description: 'Read IOs on all mounted devices', dataField: 'rIO' },
    { metricName: 'machine_disksio_wio', description: 'Write IOs on all mounted devices', dataField: 'wIO' },
    { metricName: 'machine_disksio_tio', description: 'total IOs on all mounted devices', dataField: 'tIO' },
    { metricName: 'machine_disksio_rio_sec', description: 'Read IO per seconds', dataField: 'rIO_sec' },
    { metricName: 'machine_disksio_wio_sec', description: 'Write IO per seconds', dataField: 'wIO_sec' },
    { metricName: 'machine_disksio_tio_sec', description: 'total IO per seconds', dataField: 'tIO_sec' },
    { metricName: 'machine_disksio_ms', description: 'IO internal length in milliseconds', dataField: 'ms' }
];

async function registerSimpleGauges(register: client.Registry, metrics: MetricConfig[], siFunc: Function) {
    metrics.forEach(({ metricName, description, dataField }) => {
        new client.Gauge({
            name: metricName,
            help: description,
            async collect() {
                try {
                    const data: any = await siFunc();
                    const val = data[dataField];

                    if (typeof val == "number") {
                        this.set(val);
                    } else if (typeof val == "boolean") {
                        this.set(val ? 1 : 0);
                    } else {
                        // Log unexpected type and set metric to NaN
                        console.error(`Unexpected data type for ${metricName}:`, typeof val, val);
                        this.set(NaN);
                    }
                } catch (err) {
                    // Log error and set metric to NaN so Prometheus knows scrape failed
                    console.error(`Error collecting ${metricName}:`, err);
                    this.set(NaN);
                }
            },
            registers: [register]
        });
    });
}

async function registerStaticLabeledGauge(register: client.Registry, metrics: LabeledMetricConfig, siFunc: Function) {
    const guage = new client.Gauge({
        name: metrics.metricName,
        help: metrics.description,
        labelNames: metrics.labelKeys,
        registers: [register],
    });
    try {
        const data: any = await siFunc();
        const vals = Object.fromEntries(
            metrics.labelKeys.map((fieldName, idx) =>
                [fieldName, data[metrics.dataFields[idx] as string]]
            ));
        guage.set(vals, 1);
    } catch (err) {
        console.error(`Error collecting ${metrics.metricName}:`, err);
        guage.reset();
        guage.set(NaN);
    }
}

async function registerDynamicLabeledGauge(register: client.Registry, metrics: LabeledMetricConfig, siFunc: Function) {

    const gauge = new client.Gauge({
        name: metrics.metricName,
        help: metrics.description,
        labelNames: metrics.labelKeys,
        async collect() {
            try {
                const data: any = await siFunc();
                const vals = Object.fromEntries(
                    metrics.labelKeys.map((fieldName, idx) => [`${fieldName}`, data[metrics.dataFields[idx] as string]])
                );
                this.set(vals, 1);
            } catch (err) {
                console.error(`Error collecting ${metrics.metricName}:`, err);
                this.reset();
                this.set(NaN);
            }
        },
        registers: [register],
    });
}

export async function registerSysMetrics(register: client.Registry) {

    //General
    await registerSimpleGauges(register, DYNAMIC_GENERAL_METRICS, si.time);
    await registerStaticLabeledGauge(register, STATIC_GENERAL_METRICS, si.time);

    //System (HW)
    await registerStaticLabeledGauge(register, STATIC_HW_INFO, si.system);
    await registerStaticLabeledGauge(register, STATIC_BASEBOARD_METRICS, si.baseboard);
    await registerStaticLabeledGauge(register, STATIC_CHASSIS_METRICS, si.chassis);

    //CPU
    await registerStaticLabeledGauge(register, STATIC_CPU_METRICS, si.cpu);
    await registerSimpleGauges(register, DYNAMIC_CPU_METRICS, si.cpu);
    await registerSimpleGauges(register, DYNAMIC_CPU_TEMPERATURE_METRICS, si.cpuTemperature);
    await registerDynamicLabeledGauge(register, DYNAMIC_CORE_TEMPERATURE_METRICS, si.cpuTemperature)
    await registerStaticLabeledGauge(register, STATIC_CPU_CACHE_METRICS, si.cpuCache);
    await registerSimpleGauges(register, DYNAMIC_CPU_CURRENT_SPEED_METRICS, si.cpuCurrentSpeed);

    //Memory
    await registerSimpleGauges(register, DYNAMIC_MEMORY_METRICS, si.mem);

    //Battery
    await registerSimpleGauges(register, DYNAMIC_BATTERY_METRICS, si.battery);

    // Operating system
    await registerStaticLabeledGauge(register, STATIC_OPEARTING_SYSTEM_METRICS, si.osInfo);
    await registerStaticLabeledGauge(register, STATIC_UUID_METRICS, si.uuid);

    // Filesystem
    await registerSimpleGauges(register, STATIC_DISKSIO_METRICS, si.disksIO);
}