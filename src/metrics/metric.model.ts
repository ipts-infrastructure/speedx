export type DataType = "dynamic" | "static";

// systeminformation
export interface MetricConfig {
    description: string;
    dataField: string;
};

export interface MetricsConfig {
    dataType: DataType;
    siFunctionName: string;
    metricNamePrefix: string;
    metrics: MetricConfig[];
};

export interface LabeledMetricsConfig {
    siFunctionName: string;
    resultObject?: string; // optional field
    metricNamePrefix: string;
    description: string;
    dataFields: string[];
}

/** Config for dynamic labeled gauges (array-returning SI calls, one gauge per value field). */
export interface DynamicLabeledGaugesConfig {
    siFunctionName: string;
    resultObject?: string; // optional: key to drill into when SI returns an object (e.g. graphics().controllers)
    metricNamePrefix: string;
    labelNames: string[];
    valueFields: string[];
    description?: string;
    collectErrorLabel?: string;
}

/** Discriminated union of all metric config types for a single registry. */
export type MetricDefinition =
    | { kind: 'simple'; config: MetricsConfig }
    | { kind: 'labeled'; config: LabeledMetricsConfig }
    | { kind: 'dynamicLabeled'; config: DynamicLabeledGaugesConfig };

