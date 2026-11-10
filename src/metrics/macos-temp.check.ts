import { tempsFromSensors, isPlausibleCelsius } from "./macos-temp";

const t = tempsFromSensors([
    { name: "PMU tdie1", tempC: 46.2 },
    { name: "PMU tdie2", tempC: 44.1 },
    { name: "PMU tp01g", tempC: 45.0 },
    { name: "PMU tdev0", tempC: 41.5 },
    { name: "PMU tdev1", tempC: 39.0 },
    { name: "PMU tdev2", tempC: -1.51 },
]);

if (t.cpu !== 46.2) throw new Error(`cpu max: ${t.cpu}`);
if (t.gpu !== 41.5) throw new Error(`gpu max: ${t.gpu}`);
if (t.soc == null || Math.abs(t.soc - (46.2 + 44.1 + 45.0) / 3) > 1e-9) {
    throw new Error(`soc avg: ${t.soc}`);
}
if (!isPlausibleCelsius(t.cpu)) throw new Error("46.2C should be plausible");
if (isPlausibleCelsius(-1) || isPlausibleCelsius(null) || isPlausibleCelsius(0)) {
    throw new Error("sentinels must be rejected");
}

console.log("macos-temp.check ok");
