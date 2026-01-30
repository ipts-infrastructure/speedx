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
};