// BUN
// https://bun.com/docs/guides/runtime/read-env (invesigation needed)
export const PORT = process.env.PORT || "8873";

/** Log file path. Requires write permission (e.g. create file and chown, or run as root). */
export const LOG_PATH = process.env.LOG_PATH ?? "/var/log/speedx.log";

/** Max size per log file in bytes before rotation. Default 5 MiB. */
export const LOG_MAX_SIZE_BYTES = Number(process.env.LOG_MAX_SIZE_BYTES) || 5 * 1024 * 1024;

/** Max number of rotated log files to keep (current file + rotated backups). */
export const LOG_MAX_FILES = Number(process.env.LOG_MAX_FILES) || 3;
