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

/** Single ordered list of all metric definitions to register. */
const METRICS: MetricDefinition[] = [
    // Simple (non-labeled) gauges
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "time",
            metricNamePrefix: "machine",
            metrics: [
                { description: 'System local time in milliseconds', dataField: 'current' },
                { description: 'System uptime in seconds', dataField: 'uptime' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "cpu",
            metricNamePrefix: "machine_cpu",
            metrics: [
                { description: 'Current CPU clock speed in GHz', dataField: 'speed' },
                { description: 'Minimum CPU clock speed in GHz', dataField: 'speedMin' },
                { description: 'Maximum CPU clock speed in GHz (turbo)', dataField: 'speedMax' },
                { description: 'Hardware virtualization enabled/disabled', dataField: 'virtualization' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "cpuTemperature",
            metricNamePrefix: "machine_cpu_temperature",
            metrics: [
                { description: 'Main/average CPU package temperature in °C', dataField: 'main' },
                { description: 'Maximum reported CPU temperature in °C', dataField: 'max' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "cpuCurrentSpeed",
            metricNamePrefix: "machine_cpu_current_speed",
            metrics: [
                { description: 'Average CPU speed for all cores', dataField: 'avg' },
                { description: 'Max CPU speed for all cores', dataField: 'max' },
                { description: 'Min CPU speed for all cores', dataField: 'min' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
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
                { description: 'Unused swap space in bytes', dataField: 'swapfree' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "battery",
            metricNamePrefix: "machine_battery",
            metrics: [
                { description: 'Ac connected to system', dataField: 'acConnected' },
                { description: 'Current voltage of battery of system in V', dataField: 'voltage' },
            ],
        },
    },
    {
        kind: 'simple',
        config: {
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
                { description: 'IO internal length in milliseconds', dataField: 'ms' },
            ],
        },
    },
    // Labeled gauges
    {
        kind: 'labeled',
        config: {
            siFunctionName: "time",
            metricNamePrefix: "machine_timezone_info",
            description: 'System time related information',
            dataFields: ['timezone', 'timezoneName'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "system",
            metricNamePrefix: "machine_hw_info",
            description: 'System hardware information',
            dataFields: ['version', 'serial', 'uuid'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "system",
            metricNamePrefix: "machine_baseboard_info",
            description: 'System baseboard information',
            dataFields: ['manufacturer', 'version', 'serial', 'memMax', 'memSlots'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "system",
            metricNamePrefix: "machine_chassis_info",
            description: 'System chassis information',
            dataFields: ['manufacturer', 'chassis', 'type', 'version'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "cpu",
            metricNamePrefix: "machine_cpu_info",
            description: 'CPU information',
            dataFields: ['manufacturer', 'brand', 'vendor', 'family', 'model'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "cpuTemperature",
            metricNamePrefix: "machine_cpu_core_temperature",
            description: 'CPU core temperatures in °C',
            dataFields: ['cores'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "cpuCache",
            metricNamePrefix: "machine_cpu_cache",
            description: 'System cpu cache in bytes',
            dataFields: ['l1d', 'l1i', 'l2', 'l3'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "memLayout",
            metricNamePrefix: "machine_memory_layout",
            description: 'System memory layout',
            dataFields: ['size', 'type', 'clockSpeed'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "osInfo",
            metricNamePrefix: "machine_os_info",
            description: 'System OS information',
            dataFields: ['platform', 'distro', 'release', 'codename', 'kernel', 'arch', 'hostname', 'fqdn', 'codepage', 'logofile', 'serial', 'build', 'uefi'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "uuid",
            metricNamePrefix: "machine_uuid_info",
            description: 'System UUID information',
            dataFields: ['os', 'hardware', 'macs'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "graphics",
            resultObject: "controllers",
            metricNamePrefix: "machine_graphics_controllers_info",
            description: 'System graphics controllers information',
            dataFields: ['vendor', 'model', 'deviceId', 'bus', 'vram', 'vramDynamic', 'external', 'cores', 'metalVersion'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "diskLayout",
            metricNamePrefix: "machine_disk_layout_info",
            description: 'System physical disk layout',
            dataFields: ['device', 'type', 'name', 'size', 'firmwareRevision', 'serialNum', 'interfaceType', 'smartStatus'],
        },
    },
    {
        kind: 'labeled',
        config: {
            siFunctionName: "blockDevices",
            metricNamePrefix: "machine_block_device_info",
            description: 'System disks, partitions, raids and roms',
            dataFields: ['name', 'type', 'mount', 'size', 'physical', 'uuid', 'label', 'model', 'serial', 'removable', 'protocol', 'device'],
        },
    },
    // Dynamic labeled gauges (array-returning SI methods)
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "fsSize",
            metricNamePrefix: "machine_fs",
            labelNames: ["fs", "type"],
            valueFields: ["used", "available", "use"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "users",
            metricNamePrefix: "machine_users",
            labelNames: ["user"],
            valueFields: ["tty", "date", "time", "ip", "command"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "networkInterfaces",
            metricNamePrefix: "machine_network_interfaces",
            labelNames: ["iface", "ifaceName", "mac", "internal", "virtual", "mtu", "type", "duplex", "speed"],
            valueFields: ["default", "ip4", "ip4subnet", "ip6", "ip6subnet", "operstate","dhcp","dnsSuffix", "ieee8021xAuth", "ieee8021xState", "carrierChanges"],
        },
    }
];

export async function registerSysMetrics(register: client.Registry) {
    for (const def of METRICS) {
        switch (def.kind) {
            case 'simple':
                await registerSimpleGauges(register, def.config);
                break;
            case 'labeled':
                await registerLabeledGauge(register, def.config);
                break;
            case 'dynamicLabeled':
                await registerDynamicLabeledGauges(register, def.config);
                break;
        }
    }
}