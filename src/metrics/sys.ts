import si from 'systeminformation';
import client from 'prom-client';

import { COLLECT_INTERVAL_MS } from '../configs/config';
import { logger } from '../utils/logger';
import { parseStrToNumber } from '../utils/helper';

import type {
    MetricsConfig,
    LabeledMetricsConfig,
    DynamicLabeledGaugesConfig,
    MetricDefinition,
} from './metric.model';


/** Cache: result of si.getAllData(). One fresh snapshot; all gauges read from it. */
let dataCache: Record<string, unknown> = {};

function getCachedData(siFunctionName: string): unknown {
    return dataCache[siFunctionName] ?? null;
}

/** Fetches all system data once and stores it; all gauges use this cache. */
async function refreshCache(): Promise<void> {
    try {
        const result = await si.getAllData();
        dataCache = (result as unknown) as Record<string, unknown> ?? {};
        logger.debug("All-data cache refreshed");
    } catch (err) {
        logger.error("getAllData failed: {error}", { error: err });
    }
}

/** Refreshes the all-data cache at intervalMs. Call once after METRICS is defined. */
function startCacheRefresh(intervalMs: number): void {
    setInterval(() => refreshCache(), intervalMs);
}

/** Converts a value from systeminformation to a numeric gauge value (number, boolean→0/1, else NaN). */
function toGaugeValue(val: unknown, metricName: string): number {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (typeof val === 'string' && val !== "") {
        const parsed = parseStrToNumber(val);
        if (!Number.isNaN(parsed)) return parsed;
    }
    logger.error("Unexpected data type for {metricName}: {type} {value}", { metricName, type: typeof val, value: val });
    return NaN;
}

/**
 * 
 * 
 */
async function registerSimpleGauges(register: client.Registry, metrics: MetricsConfig) {
    try {
        const dataType = metrics.dataType;
        const siFuncName = metrics.siFunctionName;
        const metricNamePrefix = metrics.metricNamePrefix;
        const metricList = metrics.metrics;
        const siResultObj = getCachedData(siFuncName) as Record<string, unknown> | null;

        if (siResultObj == null) {
            logger.error("No cached data for {siFuncName} when registering simple gauges", { siFuncName });
            return;
        }

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
                    collect() {
                        try {
                            this.reset();
                            const cached = getCachedData(siFuncName);
                            if (cached == null) {
                                this.set(NaN);
                                return;
                            }
                            const siResultObjInner = cached as Record<string, unknown>;
                            this.set(toGaugeValue(siResultObjInner[dataField], metricName));
                        } catch (err) {
                            this.reset();
                            logger.error("Error collecting {metricName}{dataField}: {error}", { metricName, dataField, error: err });
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

/**
 * 
 * 
 */
async function registerLabeledGauge(register: client.Registry, labelMetrics: LabeledMetricsConfig) {
    try {
        const siFuncName = labelMetrics.siFunctionName;
        const description = labelMetrics.description;
        const metricNamePrefix = labelMetrics.metricNamePrefix;
        const resultObject = labelMetrics?.resultObject;
        const raw = getCachedData(siFuncName) as Record<string, unknown> | null;
        if (raw == null) {
            logger.error("No cached data for {siFuncName} when registering labeled gauge", { siFuncName });
            return;
        }
        const siResultObj = resultObject ? (raw[resultObject] as Record<string, unknown>) : raw;

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
                ) as Partial<Record<string, string | number>>;
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
                ) as Partial<Record<string, string | number>>;
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
        resultObject,
        metricNamePrefix,
        labelNames,
        valueFields,
        description = `System information ${metricNamePrefix} value`,
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
            collect() {
                try {
                    this.reset();
                    const cached = getCachedData(siFunctionName);
                    if (cached == null) {
                        errorGauge.set(1);
                        return;
                    }
                    errorGauge.set(0);
                    const rawData = cached as unknown;
                    const data = resultObject
                        ? (rawData as Record<string, unknown>)[resultObject]
                        : rawData;
                    const items = Array.isArray(data) ? data : [data];

                    items.forEach((item: Record<string, unknown>) => {
                        const labels: Record<string, string> = {};
                        labelNames.forEach((label) => {
                            labels[label] = String(item[label] ?? '');
                        });
                        const value = toGaugeValue(item[field], gaugeName);
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
                // { description: 'Minimum CPU clock speed in GHz', dataField: 'speedMin' },
                // { description: 'Maximum CPU clock speed in GHz (turbo)', dataField: 'speedMax' },
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
            siFunctionName: "processes",
            metricNamePrefix: "machine_processes",
            metrics: [
                { description: 'Total number of processes', dataField: 'all' },
                { description: 'Total number of running processes', dataField: 'running' },
                { description: 'Total number of processes blocked', dataField: 'blocked' },
                { description: 'Total number of processes sleeping', dataField: 'sleeping' }
            ],
        },
    },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "currentLoad",
            metricNamePrefix: "machine_cpu_load",
            metrics: [
                { description: 'CPU average load', dataField: 'avgLoad' },
                { description: 'CPU load in %', dataField: 'currentLoad' },
                { description: 'CPU load user in %', dataField: 'currentLoadUser' },
                { description: 'CPU load system in %', dataField: 'currentLoadSystem' },
                { description: 'CPU load nice in %', dataField: 'currentLoadNice' },
                { description: 'CPU load idle in %', dataField: 'currentLoadIdle' },
                { description: 'CPU load system in %', dataField: 'currentLoadIrq' },
                { description: 'CPU load raw values (ticks)', dataField: 'rawCurrentLoad' }
            ],
        }
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
            dataType: "dynamic",
            siFunctionName: "disksIO",
            metricNamePrefix: "machine_disksio",
            metrics: [
                { description: 'Read IOs on all mounted devices', dataField: 'rIO' },
                { description: 'Write IOs on all mounted devices', dataField: 'wIO' },
                { description: 'total IOs on all mounted devices', dataField: 'tIO' },
                { description: 'Read IO per seconds', dataField: 'rIO_sec' }, //'object' null
                { description: 'Write IO per seconds', dataField: 'wIO_sec' },
                { description: 'total IO per seconds', dataField: 'tIO_sec' },
                { description: 'IO internal length in milliseconds', dataField: 'ms' },
            ],
        },
    },
    // {
    //     kind: 'simple',
    //     config: {
    //         dataType: "dynamic",
    //         siFunctionName: "fsOpenFiles",
    //         metricNamePrefix: "machine_fs_open_files",
    //         metrics: [
    //             { description: 'Max file descriptors', dataField: 'max' },
    //             { description: 'Current open files count', dataField: 'allocated' },
    //             { description: 'Count available', dataField: 'available' },
    //         ],
    //     },
    // },
    {
        kind: 'simple',
        config: {
            dataType: "dynamic",
            siFunctionName: "fsStats",
            metricNamePrefix: "machine_fs_stats",
            metrics: [
                { description: 'Bytes read since startup', dataField: 'rx' },
                { description: 'Bytes written since startup', dataField: 'wx' },
                { description: 'Total bytes read + written since startup', dataField: 'tx' },
                { description: 'Bytes read / second', dataField: 'rx_sec' },
                { description: 'Bytes written / second', dataField: 'wx_sec' },
                { description: 'total bytes reads + written / second', dataField: 'tx_sec' },
                { description: 'interval length', dataField: 'ms' },
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
            siFunctionName: "cpu",
            resultObject: "cache",
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
            siFunctionName: "os",
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
    {
        kind: 'labeled',
        config: {
            siFunctionName: "versions",
            metricNamePrefix: "machine_app_versions",
            description: 'Version information (kernel, ssl, node, ...)',
            dataFields: ["kernel", "apache", "bash", "bun", "deno", "docker", "dotnet", "fish", "gcc", "git", "grunt", "gulp", "homebrew", "java", "mongodb", "mysql", "nginx", "node", "npm", "openssl", "perl", "php", "pip3", "pip", "pm2", "postfix", "postgresql", "powershell", "python3", "python", "redis", "systemOpenssl", "systemOpensslLib", "tsc", "v8", "virtualbox", "yarn", "zsh"],
        },
    },
    // Dynamic labeled gauges (array-returning SI methods)
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "networkInterfaces",
            metricNamePrefix: "machine_network_interfaces",
            labelNames: ["iface", "ifaceName", "mac", "internal", "virtual", "mtu", "type", "duplex", "speed", "ieee8021xAuth", "ieee8021xState", "ip4subnet", "ip6subnet", "dnsSuffix", "ip4", "ip6"],
            valueFields: ["default", "dhcp", "carrierChanges", "operstate"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "networkStats",
            metricNamePrefix: "machine_network_stats",
            labelNames: ["iface"],
            valueFields: ["operstate", "rx_bytes", "rx_dropped", "rx_errors", "tx_bytes", "tx_dropped", "tx_errors", "rx_sec", "tx_sec", "ms"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "users",
            metricNamePrefix: "machine_users",
            labelNames: ["user", "date", "ip", "command", "tty",],
            valueFields: ["time"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "fsSize",
            metricNamePrefix: "machine_fs_size",
            labelNames: ["fs", "type", "size", "mount", "rw"],
            valueFields: ["used", "available", "use"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "processes",
            resultObject: "list",
            metricNamePrefix: "machine_processes_list",
            labelNames: ["pid", "name", "parentPid", "started", "state", "tty", "user", "command", "path"],
            valueFields: ["cpu", "mem", "priority", "memVsz", "nice"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "usb",
            metricNamePrefix: "machine_usb",
            labelNames: ["bus", "deviceId", "id", "name", "type", "removable", "vendor", "manufacturer", "maxPower", "serialNumber"],
            valueFields: ["default"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "networkConnections",
            metricNamePrefix: "machine_network_connections",
            labelNames: ["protocol", "localAddress", "peerAddress", "peerPort", "pid", "process"],
            valueFields: ["state"],
        },
    },
    {
        kind: 'dynamicLabeled',
        config: {
            siFunctionName: "wifiNetworks",
            metricNamePrefix: "machine_wifi_network",
            labelNames: ["ssid", "bssid", "mode", "channel", "frequency", "signalLevel"],
            valueFields: ["quality"],
        },
    },
];

export async function registerSysMetrics(register: client.Registry) {
    await refreshCache();
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
    startCacheRefresh(COLLECT_INTERVAL_MS);
}