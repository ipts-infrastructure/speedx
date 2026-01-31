import si from 'systeminformation';
import client from 'prom-client';
import type {
    MetricsConfig,
    LabeledMetricsConfig,
    DynamicLabeledGaugesConfig,
    MetricDefinition,
} from './metric.model';
import { logger } from '../utils/logger';

/** Converts a value from systeminformation to a numeric gauge value (number, boolean→0/1, else NaN). */
function toGaugeValue(val: unknown, metricName: string): number {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    logger.error("Unexpected data type for {metricName}: {type} {value}", { metricName, type: typeof val, value: val });
    return NaN;
}

// GENERAL
const DYNAMIC_GENERAL_METRICS: MetricConfig[] = [
    { metricName: 'machine_current', description: 'System local time in milliseconds', dataField: 'current' },
    { metricName: 'machine_uptime', description: 'System uptime in seconds', dataField: 'uptime' }
];

const STATIC_GENERAL_METRICS: LabeledMetricConfig = {
    metricName: 'machine_info',
    description: 'System time related information',
    labelKeys: ['timezone', 'timezone_name'],
    dataFields: ['timezone', 'timezoneName']
};

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
const DYNAMIC_CPU_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_speed', description: 'Current CPU clock speed in GHz', dataField: 'speed' },
    { metricName: 'machine_cpu_speed_min', description: 'Minimum CPU clock speed in GHz', dataField: 'speedMin' },
    { metricName: 'machine_cpu_speed_max', description: 'Maximum CPU clock speed in GHz (turbo)', dataField: 'speedMax' },
    { metricName: 'machine_cpu_virtualization', description: 'Hardware virtualization enabled/disabled', dataField: 'virtualization' }
];

const STATIC_CPU_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu_info',
    description: 'Static CPU information',
    labelKeys: ['cores', 'physical_cores', 'efficiency_cores', 'performance_cores', 'vendor', 'family', 'model'],
    dataFields: ['cores', 'physicalCores', 'efficiencyCores', 'performanceCores', 'vendor', 'family', 'model']
};

const STATIC_CPU_CACHE_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu_cache',
    description: 'System cpu cache in bytes',
    labelKeys: ['l1d_size', 'l1i_size', 'l2_size', 'l3_size'],
    dataFields: ['l1d', 'l1i', 'l2', 'l3']
}

const DYNAMIC_CPU_TEMPERATURE_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_main_temperature', description: 'Main/average CPU package temperature in °C', dataField: 'main' },
    { metricName: 'machine_cpu_max', description: 'Maximum reported CPU temperature in °C', dataField: 'max' }
];

const DYNAMIC_CPU_CURRENT_SPEED_METRICS: MetricConfig[] = [
    { metricName: 'machine_cpu_current_speed_avg', description: 'Average CPU speed for all cores', dataField: 'avg' },
    { metricName: 'machine_cpu_current_speed_max', description: 'Max CPU speed for all cores', dataField: 'max' },
    { metricName: 'machine_cpu_current_speed_min', description: 'Min CPU speed for all cores', dataField: 'min' }
];

const DYNAMIC_CORE_TEMPERATURE_METRICS: LabeledMetricConfig = {
    metricName: 'machine_cpu',
    description: 'CPU core temperatures in °C',
    labelKeys: ['cores_temperatures'],
    dataFields: ['cores']
};

// MEMORY
const DYNAMIC_MEMORY_METRICS: MetricConfig[] = [
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
const DYNAMIC_BATTERY_METRICS: MetricConfig[] = [
    { metricName: 'machine_battery_ac_connected', description: 'Ac connected to system', dataField: 'acConnected' },
    { metricName: 'machine_battery_voltage', description: 'Current voltage of battery of system in V', dataField: 'voltage' }
];

// Operating system
const STATIC_OPEARTING_SYSTEM_METRICS: LabeledMetricConfig = {
    metricName: 'machine_os',
    description: 'System OS information',
    labelKeys: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi'],
    dataFields: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi']
};

// Current load, processes & services
// const DYNAMIC_CURRENT_LOAD: MetricConfig[] = [
//     { metricName: 'machine_current_load', description: 'Ac connected to system', dataField: 'acConnected' },

// ];

const STATIC_UUID_METRICS: LabeledMetricConfig = {
    metricName: 'machine_uuid',
    description: 'System UUID information',
    labelKeys: ['os', 'hardware', 'macs'],
    dataFields: ['os', 'hardware', 'macs']
};

// Disk IO
const STATIC_DISKSIO_METRICS: MetricConfig[] = [
    { metricName: 'machine_disksio_rio', description: 'Read IOs on all mounted devices', dataField: 'rIO' },
    { metricName: 'machine_disksio_wio', description: 'Write IOs on all mounted devices', dataField: 'wIO' },
    { metricName: 'machine_disksio_tio', description: 'total IOs on all mounted devices', dataField: 'tIO' },
    { metricName: 'machine_disksio_rio_sec', description: 'Read IO per seconds', dataField: 'rIO_sec' },
    { metricName: 'machine_disksio_wio_sec', description: 'Write IO per seconds', dataField: 'wIO_sec' },
    { metricName: 'machine_disksio_tio_sec', description: 'total IO per seconds', dataField: 'tIO_sec' },
    { metricName: 'machine_disksio_ms', description: 'IO internal length in milliseconds', dataField: 'ms' }
];


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
                gauge.set(toGaugeValue(siResultObj[dataField], metricName));
            } else {
                new client.Gauge({
                    name: metricName,
                    help: description,
                    registers: [register],
                    async collect() {
                        try {
                            this.reset();
                            logger.debug("Refreshing metric {metricName}", { metricName });
                            const siResultObjInner = await (si as any)[siFuncName]();
                            this.set(toGaugeValue(siResultObjInner[dataField], metricName));
                        } catch (err) {
                            this.reset();
                            logger.error("Error collecting {metricName}: {error}", { metricName, error: err });
                            this.set(NaN);
                        }
                    },
                });
            }
        });
    } catch (err) {
        logger.error("Error collecting metric {prefix}: {error}", { prefix: metrics.metricNamePrefix, error: err });
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

                const gauge = new client.Gauge({
                    name: `${metricNamePrefix}_${index}`,
                    help: description,
                    registers: [register],
                    labelNames: Object.keys(itemObj) as any,
                });

                const vals = Object.fromEntries(
                    labelMetrics.dataFields.map((fieldName) => [fieldName, itemObj[fieldName]])
                );
                gauge.set(vals, 1);

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
                    labelMetrics.dataFields.map((fieldName) => [fieldName, siResultObj[fieldName]])
                );
                gauge.set(vals, 1);
            } catch (err) {
                logger.error("Error collecting {prefix}: {error}", { prefix: metricNamePrefix, error: err });
                gauge.set(NaN)
            }
        } else {
            logger.error("Unsupported metric: {prefix}", { prefix: metricNamePrefix });
        }
    } catch (err) {
        logger.error("Error collecting metric {prefix}: {error}", { prefix: labelMetrics.metricNamePrefix, error: err });
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

/**
 * Registers one or more gauges that expose numeric fields from systeminformation
 * calls that return an array of objects (e.g. fsSize, disksIO, etc.)
 */
async function registerDynamicLabeledGauges(
    register: client.Registry,
    config: DynamicLabeledGaugesConfig
) {
    const {
        siFunctionName,
        metricNamePrefix,
        labelNames,
        valueFields,
        description = "System information value",
        collectErrorLabel = `${metricNamePrefix}_collect_error`,
    } = config;

    const errorGauge = new client.Gauge({
        name: collectErrorLabel,
        help: `1 = last collection failed for ${String(siFunctionName)}`,
        registers: [register],
    });

    const gauges = valueFields.map((field) => {
        const gaugeName = `${metricNamePrefix}_${field}`;

        return new client.Gauge({
            name: gaugeName,
            help: `${description} - ${field}`,
            labelNames,
            registers: [register],
            async collect() {
                try {
                    errorGauge.set(0);
                    const data = await (si as any)[siFunctionName]();
                    const items = Array.isArray(data) ? data : [data];

                    items.forEach((item: Record<string, any>) => {
                        const labels: Record<string, string> = {};
                        labelNames.forEach((label) => {
                            labels[label] = String(item[label] ?? '');
                        });
                        const value = Number(item[field]);
                        if (!Number.isNaN(value)) {
                            this.set(labels, value);
                        }
                    });
                } catch (err) {
                    logger.error("Error collecting {gaugeName}: {error}", { gaugeName, error: err });
                    errorGauge.set(1);
                }
            },
        });
    });

    return { gauges, errorGauge };
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
