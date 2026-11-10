import { logger } from "../utils/logger";

export type AppleSiliconTemps = {
    cpu: number | null;
    soc: number | null;
    gpu: number | null;
    cores: number[];
};

type HidSensor = { name: string; tempC: number };

type NativeAddon = {
    snapshot: () => { sensors: HidSensor[] };
};

type MacosTempModule = {
    temperature: () => {
        cpu: number | null;
        soc: number;
        gpu: number | null;
        cpuDieTemps?: number[];
    };
};

/** SI/macos-temperature-sensor use null or -1 when a sensor is missing. */
export function isPlausibleCelsius(n: unknown): n is number {
    return typeof n === "number" && Number.isFinite(n) && n > 1 && n < 120;
}

function maxTemp(temps: number[]): number | null {
    return temps.length ? Math.max(...temps) : null;
}

function avgTemp(temps: number[]): number | null {
    if (!temps.length) return null;
    return temps.reduce((a, b) => a + b, 0) / temps.length;
}

/** Same sensor-name mapping as macos-temperature-sensor 2.x. */
export function tempsFromSensors(sensors: HidSensor[]): AppleSiliconTemps {
    const tdie: number[] = [];
    const tpg: number[] = [];
    const tdev: number[] = [];
    const tgSmc: number[] = [];

    for (const element of sensors) {
        if (!isPlausibleCelsius(element.tempC)) continue;
        const name = element.name.toLowerCase().replace(/^pmu2 /, "pmu ");
        if (name.startsWith("pmu tdie")) tdie.push(element.tempC);
        if (name.startsWith("pmu tp") && name.endsWith("g")) tpg.push(element.tempC);
        if (name.startsWith("pmu tdev")) tdev.push(element.tempC);
        if (name.startsWith("smc tg")) tgSmc.push(element.tempC);
    }

    const gpuTemps = tdev.length ? tdev : tgSmc;
    return {
        cpu: maxTemp(tdie),
        soc: avgTemp(tdie.concat(tpg)),
        gpu: maxTemp(gpuTemps),
        cores: tdie,
    };
}

function loadTemps(): AppleSiliconTemps | null {
    if (process.platform !== "darwin" || process.arch !== "arm64") return null;

    try {
        const native = require("macos-temperature-sensor/build/Release/mac_temp_native.node") as NativeAddon;
        return tempsFromSensors(native.snapshot().sensors);
    } catch {
        // bun run / node_modules layout
    }

    try {
        const macosTemp = require("macos-temperature-sensor") as MacosTempModule;
        const t = macosTemp.temperature();
        return {
            cpu: t.cpu,
            soc: isPlausibleCelsius(t.soc) ? t.soc : null,
            gpu: t.gpu,
            cores: t.cpuDieTemps ?? [],
        };
    } catch (err) {
        logger.warn("macos-temperature-sensor unavailable: {error}", { error: err });
        return null;
    }
}

function roundC(n: number): number {
    return Math.round(n * 100) / 100;
}

/**
 * systeminformation require()s the native addon at runtime, so bun --compile
 * never embeds it and cpuTemperature.main/max stay null → Prometheus Nan.
 * Write real readings onto the SI cache when the addon loads.
 */
export function overlayAppleSiliconTemps(dataCache: Record<string, unknown>): void {
    const t = loadTemps();
    if (!t) return;

    const main = isPlausibleCelsius(t.soc) ? t.soc : t.cpu;
    const max = isPlausibleCelsius(t.cpu) ? t.cpu : main;
    if (!isPlausibleCelsius(main) && !isPlausibleCelsius(max) && !isPlausibleCelsius(t.gpu)) {
        logger.warn("macos-temperature-sensor returned no plausible CPU/GPU readings");
        return;
    }

    const prev = (dataCache.cpuTemperature as Record<string, unknown> | undefined) ?? {};
    dataCache.cpuTemperature = {
        ...prev,
        main: isPlausibleCelsius(main) ? roundC(main) : prev.main ?? null,
        max: isPlausibleCelsius(max) ? roundC(max) : prev.max ?? null,
        chipset: isPlausibleCelsius(t.soc) ? roundC(t.soc) : prev.chipset ?? null,
        cores: t.cores.map(roundC),
    };

    if (!isPlausibleCelsius(t.gpu)) return;

    const graphics = dataCache.graphics as { controllers?: Record<string, unknown>[] } | undefined;
    if (!graphics?.controllers?.length) return;
    for (const controller of graphics.controllers) {
        if (controller.bus === "Built-In" || graphics.controllers.length === 1) {
            controller.temperatureGpu = roundC(t.gpu);
        }
    }
}
