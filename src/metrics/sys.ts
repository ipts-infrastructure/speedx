import si from 'systeminformation';
import client from 'prom-client';

interface MetricConfig {
    name: string;
    help: string;
    field: string;
};

interface LabelMetricConfig {
    name: string;
    help: string;
    fieldsName: string[];
    fields: string[];
}

const GENERAL_METRICS: MetricConfig[] = [
    { name: 'machine_current', help: 'System local time in milliseconds', field: 'current' },
    { name: 'machine_uptime', help: 'System uptime in seconds', field: 'uptime' }
];

const STATIC_GENERAL_METRICS: LabelMetricConfig = {
    name: 'machine_info',
    help: 'System TBD',
    fieldsName: ['timezone', 'timezone_name'],
    fields: ['timezone', 'timezoneName']
};

const MEMORY_METRICS: MetricConfig[] = [
    { name: 'machine_memory_total', help: 'Total physical memory in bytes', field: 'total' },
    { name: 'machine_memory_free', help: 'Unused memory in bytes', field: 'free' },
    { name: 'machine_memory_used', help: 'Currently used memory in bytes', field: 'used' },
    { name: 'machine_memory_active', help: 'Memory actively in use (excluding buffers/cache)', field: 'active' },
    { name: 'machine_memory_buffcache', help: 'Memory used for buffers and cache', field: 'buffcache' },
    { name: 'machine_memory_reclaimable', help: 'Cache memory that can be reclaimed', field: 'reclaimable' },
    { name: 'machine_memory_available', help: 'Memory available for new processes without swapping', field: 'available' },
    { name: 'machine_memory_swaptotal', help: 'Total swap space in bytes', field: 'swaptotal' },
    { name: 'machine_memory_swapused', help: 'Swap space currently in use in bytes', field: 'swapused' },
    { name: 'machine_memory_swapfree', help: 'Unused swap space in bytes', field: 'swapfree' }
];

const SYSTEM_HW_METRICS: LabelMetricConfig = {
    name: 'machine_hw_info',
    help: 'Static Hardware information',
    fieldsName: ['version', 'serial', 'uuid'],
    fields: ['version', 'serial', 'uuid']
};

const CPU_METRICS: MetricConfig[] = [
    { name: 'machine_cpu_speed', help: 'Current CPU clock speed in GHz', field: 'speed' },
    { name: 'machine_cpu_speed_min', help: 'Minimum CPU clock speed in GHz', field: 'speedMin' },
    { name: 'machine_cpu_speed_max', help: 'Maximum CPU clock speed in GHz (turbo)', field: 'speedMax' },
    { name: 'machine_cpu_virtualization', help: 'Hardware virtualization enabled/disabled', field: 'virtualization' }
];

const CPU_TEMPERATURE_METRICS: MetricConfig[] = [
    { name: 'machine_cpu_main_temperature', help: 'Main/average CPU package temperature in °C', field: 'main' },
    { name: 'machine_cpu_cores', help: 'Per-core CPU temperatures in °C (array)', field: 'cores' },
    { name: 'machine_cpu_max', help: 'Maximum reported CPU temperature in °C', field: 'max' },
    { name: 'machine_cpu_socket', help: 'CPU socket/DTS temperatures in °C (array)', field: 'socket' },
    { name: 'machine_cpu_chipset', help: 'Chipset temperature in °C (if available)', field: 'chipset' }
];

const STATIC_CPU_METRICS: LabelMetricConfig = {
    name: 'machine_cpu_info',
    help: 'Static CPU information',
    fieldsName: ['cores', 'physical_cores', 'efficiency_cores', 'performance_cores', 'vendor', 'family', 'model'],
    fields: ['cores', 'physicalCores', 'efficiencyCores', 'performanceCores', 'vendor', 'family', 'model']
};

async function registerGauge(register: client.Registry, metrics: MetricConfig[], siFunc: Function) {
    metrics.forEach(({ name, help, field }) => {
        new client.Gauge({
            name,
            help,
            async collect() {
                try {
                    const data: any = await siFunc();
                    console.info(`Data for ${name}:`);
                    const val = data[field];

                    if (typeof val == "number") {
                        this.set(val);
                    } else if (typeof val == "boolean") {
                        this.set(val ? 1 : 0);
                    } else {
                        // Log unexpected type and set metric to NaN
                        console.error(`Unexpected data type for ${name}:`, typeof val, val);
                        this.set(NaN);
                    }

                } catch (err) {
                    // Log error and set metric to NaN so Prometheus knows scrape failed
                    console.error(`Error collecting ${name}:`, err);
                    this.set(NaN);
                }
            },
            registers: [register]
        });
    });
}

async function registerGaugeWithLabel(register: client.Registry, metrics: LabelMetricConfig, siFunc: Function) {
    const guage = new client.Gauge({
        name: metrics.name,
        help: metrics.help,
        labelNames: metrics.fieldsName,
        registers: [register],
    });
    try {
        const data: any = await siFunc();
        const vals = Object.fromEntries(
            metrics.fieldsName.map((fieldName, idx) => [fieldName, data[metrics.fields[idx] as string]])
        );
        guage.set(vals, 1);
    } catch (err) {
        console.error(`Error collecting ${metrics.name}:`, err);
        guage.reset();
        guage.set(NaN);
    }
}

export async function registerSysMetrics(register: client.Registry) {
    const temp = await si.cpuTemperature()
    await registerGauge(register, MEMORY_METRICS, si.mem);
    await registerGaugeWithLabel(register, STATIC_GENERAL_METRICS, si.time);
    await registerGauge(register, GENERAL_METRICS, si.time);
    await registerGaugeWithLabel(register, STATIC_CPU_METRICS, si.cpu);
    await registerGauge(register, CPU_METRICS, si.cpu);
    await registerGauge(register, CPU_TEMPERATURE_METRICS, si.cpuTemperature);
    await registerGaugeWithLabel(register, SYSTEM_HW_METRICS, si.system);


}
