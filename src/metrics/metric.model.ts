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
