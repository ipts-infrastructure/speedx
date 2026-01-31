import { configure, getLogger } from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";
import { LOG_PATH, LOG_MAX_SIZE_BYTES, LOG_MAX_FILES } from "../configs/config";

let configured = false;

/**
 * Configures LogTape with a single rotating file sink (path and rotation from config).
 * Must be awaited before any logging. Safe to call multiple times (no-op after first).
 */
export async function initLogger(): Promise<void> {
    if (configured) return;
    await configure({
        sinks: {
            file: getRotatingFileSink(LOG_PATH, {
                maxSize: LOG_MAX_SIZE_BYTES,
                maxFiles: LOG_MAX_FILES,
            }),
        },
        loggers: [
            {
                category: ["speedx"],
                sinks: ["file"],
                lowestLevel: "error",
            },
        ],
    });
    configured = true;
}

/** Logger for the speedx app. Use after initLogger() has been awaited. */
export const logger = getLogger("speedx");
