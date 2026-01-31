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
    metricNamePrefix: string;
    labelNames: string[];
    valueFields: string[];
    description?: string;
    collectErrorLabel?: string;
}

