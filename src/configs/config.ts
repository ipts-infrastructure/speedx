import { parseArgs } from "util";

const { values } = parseArgs({
    options: {
        port: { type: 'string', default: '8872' },
        ci: { type: 'string', default: '5000' }, // collect interval
        logPath: { type: 'string', default: '/var/log/speedx.log' },
        logMaxSize: { type: 'string', default: '5242880' }
    }
});

/**
 * Exporter
 */

/** Whether the app is running in production (NODE_ENV === "production"). */
export const isProduction = process.env.NODE_ENV === "production";

/** Interval in ms for pre-fetching dynamic data. */
export const COLLECT_INTERVAL_MS = Number(values.ci);

console.log(`Collect interval set to ${COLLECT_INTERVAL_MS} ms`);

/**
 * Bun
 */

// https://bun.com/docs/guides/runtime/read-env (invesigation needed)
export const PORT = values.port;

console.log(`Listening on port ${PORT}`);


/**
 * Logtape
 */

/** Log file path. Requires write permission (e.g. create file and chown, or run as root). */
export const LOG_PATH = values.logPath;

console.log(`Log file path set to ${LOG_PATH}`);

/** Max size per log file in bytes before rotation. Default 5 MiB. */
export const LOG_MAX_SIZE_BYTES = Number(values.logMaxSize);

console.log(`Log max size set to ${LOG_MAX_SIZE_BYTES} bytes`);

/** Max number of rotated log files to keep (current file + rotated backups). */
export const LOG_MAX_FILES = 1;

/**
 * systeminformation 
 */
