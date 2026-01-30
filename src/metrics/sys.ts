import si from 'systeminformation';
import client from 'prom-client';
import type { MetricsConfig, LabeledMetricsConfig } from './metric.model';

// GENERAL
const DYNAMIC_GENERAL_METRICS: MetricsConfig = {
    "dataType": "dynamic",
    "siFunctionName": "time",
    "metricNamePrefix": "machine",
    "metrics": [
        { description: 'System local time in milliseconds', dataField: 'current' },
        { description: 'System uptime in seconds', dataField: 'uptime' }
    ]
};

const STATIC_GENERAL_METRICS: LabeledMetricsConfig = {
    siFunctionName: "time",
    metricNamePrefix: "machine_timezone_info",
    description: 'System time related information',
    dataFields: ['timezone', 'timezoneName']
};

// SYSTEM (HW)
const STATIC_HW_INFO_METRICS: LabeledMetricsConfig = {
    siFunctionName: "system",
    metricNamePrefix: "machine_hw_info",
    description: 'System hardware information',
    dataFields: ['version', 'serial', 'uuid']
}

// BASEBOARD
const STATIC_BASEBOARD_METRICS: LabeledMetricsConfig = {
    siFunctionName: "system",
    metricNamePrefix: "machine_baseboard_info",
    description: 'System basedboard information',
    dataFields: ['manufacturer', 'version', 'serial', 'memMax', 'memSlots']

}

// CHASSIS 
const STATIC_CHASSIS_METRICS: LabeledMetricsConfig = {
    siFunctionName: "system",
    metricNamePrefix: "machine_chassis_info",
    description: 'System chassis information',
    dataFields: ['manufacturer', 'chassis', 'type', 'version']
}

// CPU
const DYNAMIC_CPU_METRICS: MetricsConfig = {
    dataType: "dynamic",
    siFunctionName: "cpu",
    metricNamePrefix: "machine_cpu",
    metrics: [
        { description: 'Current CPU clock speed in GHz', dataField: 'speed' },
        { description: 'Minimum CPU clock speed in GHz', dataField: 'speedMin' },
        { description: 'Maximum CPU clock speed in GHz (turbo)', dataField: 'speedMax' },
        { description: 'Hardware virtualization enabled/disabled', dataField: 'virtualization' }
    ]
}

const STATIC_CPU_METRICS: LabeledMetricsConfig = {
    siFunctionName: "cpu",
    metricNamePrefix: "machine_cpu_info",
    description: 'System chassis information',
    dataFields: ['manufacturer', 'chassis', 'type', 'version']
}

const DYNAMIC_CPU_TEMPERATURE_METRICS: MetricsConfig = {
    dataType: "dynamic",
    siFunctionName: "cpuTemperature",
    metricNamePrefix: "machine_cpu_temperature",
    metrics: [
        { description: 'Main/average CPU package temperature in °C', dataField: 'main' },
        { description: 'Maximum reported CPU temperature in °C', dataField: 'max' }
    ]
}

const DYNAMIC_CPU_SPEED_METRICS: MetricsConfig = {
    dataType: "dynamic",
    siFunctionName: "cpuCurrentSpeed",
    metricNamePrefix: "machine_cpu_current_speed",
    metrics: [
        { description: 'Average CPU speed for all cores', dataField: 'avg' },
        { description: 'Max CPU speed for all cores', dataField: 'max' },
        { description: 'Min CPU speed for all cores', dataField: 'min' }
    ]
}

const DYNAMIC_CORE_TEMPERATURE_METRICS: LabeledMetricsConfig = {
    siFunctionName: "cpuTemperature",
    metricNamePrefix: "machine_cpu_core_temperature",
    description: 'CPU core temperatures in °C',
    dataFields: ['cores']
}

const STATIC_CPU_CACHE_METRICS: LabeledMetricsConfig = {
    siFunctionName: "cpuCache",
    metricNamePrefix: "machine_cpu_cache",
    description: 'System cpu cache in bytes',
    dataFields: ['l1d', 'l1i', 'l2', 'l3']
}

// MEMORY
const DYNAMIC_MEMORY_METRICS: MetricsConfig = {
    dataType: "dynamic",
    siFunctionName: "mem",
    metricNamePrefix: "machine_memory",
    metrics: [
        { description: 'Total physical memory in bytes', dataField: 'total' },
        { description: 'Unused memory in bytes', dataField: 'free' },
        { description: 'Currently used memory in bytes', dataField: 'used' },
        { description: 'Memory actively in use (excluding buffers/cache)', dataField: 'active' },
        { description: 'Memory used for buffers and cache', dataField: 'buffcache' },
        { description: 'Cache memory that can be reclaimed', dataField: 'reclaimable' },
        { description: 'Memory available for new processes without swapping', dataField: 'available' },
        { description: 'Total swap space in bytes', dataField: 'swaptotal' },
        { description: 'Swap space currently in use in bytes', dataField: 'swapused' },
        { description: 'Unused swap space in bytes', dataField: 'swapfree' }
    ]
}

const DYNAMIC_MEMORY_LAYOUT_METRICS: LabeledMetricsConfig = {
    siFunctionName: "memLayout",
    metricNamePrefix: "machine_memory_layout",
    description: 'System memory layout',
    dataFields: ['size', 'type', 'clockSpeed', 'manufacturer']
}

// Battery
const DYNAMIC_BATTERY_METRICS: MetricsConfig = {
    dataType: "dynamic",
    siFunctionName: "battery",
    metricNamePrefix: "machine_battery",
    metrics: [
        { description: 'Ac connected to system', dataField: 'acConnected' },
        { description: 'Current voltage of battery of system in V', dataField: 'voltage' }
    ]
}

// Disk IO
const STATIC_DISKSIO_METRICS: MetricsConfig = {
    dataType: "static",
    siFunctionName: "disksIO",
    metricNamePrefix: "machine_disksio",
    metrics: [
        { description: 'Read IOs on all mounted devices', dataField: 'rIO' },
        { description: 'Write IOs on all mounted devices', dataField: 'wIO' },
        { description: 'total IOs on all mounted devices', dataField: 'tIO' },
        { description: 'Read IO per seconds', dataField: 'rIO_sec' },
        { description: 'Write IO per seconds', dataField: 'wIO_sec' },
        { description: 'total IO per seconds', dataField: 'tIO_sec' },
        { description: 'IO internal length in milliseconds', dataField: 'ms' }
    ]
}

// OS
const STATIC_OPEARTING_SYSTEM_METRICS: LabeledMetricsConfig = {
    siFunctionName: "osInfo",
    metricNamePrefix: "machine_os_info",
    description: 'System OS information',
    dataFields: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi']
}

// UUID
const STATIC_UUID_METRICS: LabeledMetricsConfig = {
    siFunctionName: "uuid",
    metricNamePrefix: "machine_uuid_info",
    description: 'System UUID information',
    dataFields: ['os', 'hardware', 'macs']
}

// GRAPHIC
const STATIC_GRAPHIC_CONTROLLERS_METRICS: LabeledMetricsConfig = {
    siFunctionName: "graphics",
    resultObject: "controllers",
    metricNamePrefix: "machine_graphics_controllers_info",
    description: 'System graphics controllers information',
    dataFields: ['vendor', 'model', 'deviceId', 'bus', 'vram', 'vramDynamic', 'external', 'cores', 'metalVersion']
}

// FILE SYSTEM
const STATIC_DISK_LAYOUT_METRICS: LabeledMetricsConfig = {
    siFunctionName: "diskLayout",
    metricNamePrefix: "machine_disk_layout_info",
    description: 'System physical disk layout',
    dataFields: ['device', 'type', 'name', 'size', 'firmwareRevision', 'serialNum', 'interfaceType', 'smartStatus']
}

const STATIC_BLOCK_DEVICE_METRICS: LabeledMetricsConfig = {
    siFunctionName: "blockDevices",
    metricNamePrefix: "machine_block_device_info",
    description: 'System disks, partitions, raids and roms',
    dataFields: ['name', 'type', 'mount', 'size', 'physical', 'uuid', 'label', 'model', 'serial', 'removable', 'protocol', 'device']
}

async function registerSimpleGauges(register: client.Registry, metrics: MetricsConfig) {
    try {
        const dataType = metrics.dataType;
        const siFuncName = metrics.siFunctionName;
        const metricNamePrefix = metrics.metricNamePrefix;
        const metricList = metrics.metrics;
        const siResultObj = await (si as any)[siFuncName]();

        metricList.forEach(({ description, dataField }) => {

            const metricName = `${metricNamePrefix}_${dataField}`;

            if (dataType === "static") {
                const gauge = new client.Gauge({
                    name: metricName,
                    help: description,
                    registers: [register]
                });
                const val = siResultObj[dataField];
                if (typeof val == "number") {
                    gauge.set(val);
                } else if (typeof val == "boolean") {
                    gauge.set(val ? 1 : 0);
                } else {
                    // Log unexpected type and set metric to NaN
                    console.error(`Unexpected data type for ${metricName}:`, typeof val, val);
                    gauge.set(NaN);
                }
            } else {
                new client.Gauge({
                    name: metricName,
                    help: description,
                    registers: [register],
                    async collect() {
                        try {
                            this.reset();
                            console.log(`Refreshing metric ${metricName}`);
                            const siResultObjInner = await (si as any)[siFuncName]();
                            const val = siResultObjInner[dataField];
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
                            this.reset();
                            // Log error and set metric to NaN so Prometheus knows scrape failed
                            console.error(`Error collecting ${metricName}:`, err);
                            this.set(NaN);
                        }
                    },
                });
            }
        });
    } catch (err) {
        console.error(`Error collecting metric: ${metrics.metricNamePrefix}`, err);
    }

}

async function registerLabeledGauge(register: client.Registry, labelMetrics: LabeledMetricsConfig) {
    try {
        const siFuncName = labelMetrics.siFunctionName;
        const description = labelMetrics.description;
        const metricNamePrefix = labelMetrics.metricNamePrefix;
        const resultObject = labelMetrics?.resultObject;
        const siResultObj = resultObject ? (await (si as any)[siFuncName]())[resultObject] : await (si as any)[siFuncName]();

        if (Array.isArray(siResultObj)) {
            siResultObj.forEach((itemObj: Record<string, any>, index: number) => {

                const gauage = new client.Gauge({
                    name: `${metricNamePrefix}_${index}`,
                    help: description,
                    registers: [register],
                    labelNames: Object.keys(itemObj) as any,
                });

                const vals = Object.fromEntries(
                    labelMetrics.dataFields.map((fieldName, idx) =>
                        [fieldName, itemObj[fieldName]]
                    ));

                gauage.set(vals, 1);

            });
        } else if (typeof siResultObj === "object") {
            const gauge = new client.Gauge({
                name: metricNamePrefix,
                help: description,
                labelNames: labelMetrics.dataFields,
                registers: [register]
            })

            try {
                const vals = Object.fromEntries(
                    labelMetrics.dataFields.map((fieldName, idx) =>
                        [fieldName, siResultObj[labelMetrics.dataFields[idx] as string]]
                    ));
                gauge.set(vals, 1);
            } catch (err) {
                console.error(`Error collecting ${metricNamePrefix}:`, err);
                gauge.set(NaN)
            }
        } else {
            console.error(`Unsupported metric: ${metricNamePrefix}`)
        }
    } catch (err) {
        console.error(`Error collecting metric: ${labelMetrics.metricNamePrefix}`, err);
    }
}

async function registerFsGuage(register: client.Registry) {

    try {
        new client.Gauge({
            name: "machine_fs_used",
            help: "System mounted file systems information",
            labelNames: ["fs", "type"],
            registers: [register],
            async collect() {
                try {
                    const data = await si.fsSize();
                    data.forEach((resultObj: Record<string, any>) => {
                        this.set({
                            "fs": resultObj?.fs,
                            "type": resultObj?.type
                        }, resultObj?.used || NaN);
                    });
                } catch (err) {
                    console.error(`Error collecting machine_fs_used metric:`, err);
                }
            }
        });

        new client.Gauge({
            name: "machine_fs_available",
            help: "System mounted file systems information",
            labelNames: ["fs", "type"],
            registers: [register],
            async collect() {
                try {
                    const data = await si.fsSize();
                    data.forEach((resultObj: Record<string, any>) => {
                        this.set({
                            "fs": resultObj?.fs,
                            "type": resultObj?.type
                        }, resultObj?.available || NaN);
                    });
                } catch (err) {
                    console.error(`Error collecting machine_fs_available metric:`, err);
                }
            }
        });

        new client.Gauge({
            name: "machine_fs_use",
            help: "System mounted file systems information",
            labelNames: ["fs", "type"],
            registers: [register],
            async collect() {
                try {
                    const data = await si.fsSize();
                    data.forEach((resultObj: Record<string, any>) => {
                        this.set({
                            "fs": resultObj?.fs,
                            "type": resultObj?.type
                        }, resultObj?.use || NaN);
                    });
                } catch (err) {
                    console.error(`Error collecting machine_fs_use metric:`, err);
                }
            }
        });
    } catch (err) {
        console.error(`Error registering FS gauges:`, err);
    }
}

/**
 * Registers one or more gauges that expose numeric fields from systeminformation
 * calls that return an array of objects (e.g. fsSize, disksIO, etc.)
 */
async function registerDynamicLabeledGauges(
    register: client.Registry,
    options: {
        siMethod: keyof typeof si;                   // e.g. "fsSize", "mem", "fsStats"
        metricPrefix: string;                        // e.g. "machine_fs"
        labelNames: string[];                        // e.g. ["fs", "type"] or ["device"]
        valueFields: string[];                       // e.g. ["used", "available", "size"]
        help?: string;                               // optional custom help text
        collectErrorLabel?: string;                  // optional, e.g. "fs_collect_error"
    }
) {
    const {
        siMethod,
        metricPrefix,
        labelNames,
        valueFields,
        help = "System information value",
        collectErrorLabel = `${metricPrefix}_collect_error`,
    } = options;

    // Create error gauge (optional but very useful in production)
    const errorGauge = new client.Gauge({
        name: collectErrorLabel,
        help: `1 = last collection failed for ${siMethod}`,
        registers: [register],
    });

    // Create one gauge per value field
    const gauges = valueFields.map((field) => {
        const gaugeName = `${metricPrefix}_${field}`;

        return new client.Gauge({
            name: gaugeName,
            help: `${help} - ${field}`,
            labelNames,
            registers: [register],
            async collect() {
                try {
                    // Reset error gauge on successful collection
                    errorGauge.set(0);

                    // Call the systeminformation method (e.g. si.fsSize())
                    const data = await (si[siMethod] as any)();

                    // Most si methods return arrays → handle both array and single object
                    const items = Array.isArray(data) ? data : [data];

                    items.forEach((item: Record<string, any>) => {
                        const labels: Record<string, string> = {};

                        // Build label object dynamically
                        labelNames.forEach((label) => {
                            // Use empty string if value is missing/undefined
                            labels[label] = String(item[label] ?? '');
                        });

                        const value = Number(item[field]);

                        // Only set valid numbers (avoid NaN pollution)
                        if (!Number.isNaN(value)) {
                            this.set(labels, value);
                        }
                    });
                } catch (err) {
                    console.error(`Error collecting ${gaugeName}:`, err);
                    errorGauge.set(1);
                    // Optionally: this.clear();  // ← removes stale values (be careful!)
                }
            },
        });
    });

    // Optional: return the created gauges if you need to reference them later
    return { gauges, errorGauge };
}

export async function registerSysMetrics(register: client.Registry) {
    //General
    await registerSimpleGauges(register, DYNAMIC_GENERAL_METRICS);
    await registerLabeledGauge(register, STATIC_GENERAL_METRICS);

    // System HW
    await registerLabeledGauge(register, STATIC_HW_INFO_METRICS);

    // Baseboard
    await registerLabeledGauge(register, STATIC_BASEBOARD_METRICS);

    // Chassis
    await registerLabeledGauge(register, STATIC_CHASSIS_METRICS);

    // CPU
    await registerSimpleGauges(register, DYNAMIC_CPU_METRICS);
    await registerLabeledGauge(register, STATIC_CPU_METRICS);
    await registerSimpleGauges(register, DYNAMIC_CPU_TEMPERATURE_METRICS);
    await registerSimpleGauges(register, DYNAMIC_CPU_SPEED_METRICS);
    await registerLabeledGauge(register, DYNAMIC_CORE_TEMPERATURE_METRICS);
    await registerLabeledGauge(register, STATIC_CPU_CACHE_METRICS);

    // Memory
    await registerSimpleGauges(register, DYNAMIC_MEMORY_METRICS);
    await registerSimpleGauges(register, DYNAMIC_BATTERY_METRICS);
    await registerLabeledGauge(register, DYNAMIC_MEMORY_LAYOUT_METRICS);

    // DISKSIO
    await registerSimpleGauges(register, STATIC_DISKSIO_METRICS);

    // Operating system
    await registerLabeledGauge(register, STATIC_OPEARTING_SYSTEM_METRICS);

    // UUID
    await registerLabeledGauge(register, STATIC_UUID_METRICS);

    // GRAPHIC 
    await registerLabeledGauge(register, STATIC_GRAPHIC_CONTROLLERS_METRICS);

    // File system
    await registerLabeledGauge(register, STATIC_DISK_LAYOUT_METRICS);
    await registerLabeledGauge(register, STATIC_BLOCK_DEVICE_METRICS);

    await registerDynamicLabeledGauges(
        register,
        {
            siMethod: "fsSize",
            metricPrefix: "machine_fs",
            labelNames: ["fs", "type"],
            valueFields: ["used", "available", "use"],
        }
    );

    await registerDynamicLabeledGauges(
        register,
        {
            siMethod: "users",
            metricPrefix: "machine_users",
            labelNames: ["user"],
            valueFields: ["tty", "date", "time", "ip", "command"],
        }
    );
}