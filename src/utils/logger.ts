import { configure, getConsoleSink, getLogger } from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";
import {
    isProduction,
    LOG_PATH,
    LOG_MAX_SIZE_BYTES,
    LOG_MAX_FILES,
} from "../configs/config";

let configured = false;

/**
 * Configures LogTape with a rotating file sink (path and rotation from config).
 * When not in production, also adds a console sink for terminal output.
 * Must be awaited before any logging. Safe to call multiple times (no-op after first).
 */
export async function initLogger(): Promise<void> {
    if (configured) return;
    const sinks: Record<string, ReturnType<typeof getRotatingFileSink> | ReturnType<typeof getConsoleSink>> = {
        file: getRotatingFileSink(LOG_PATH, {
            maxSize: LOG_MAX_SIZE_BYTES,
            maxFiles: LOG_MAX_FILES,
        }),
    };
    if (!isProduction) {
        sinks.console = getConsoleSink();
    }
    await configure({
        sinks,
        loggers: [
            {
                category: ["speedx"],
                sinks: isProduction ? ["file"] : ["console", "file"],
                lowestLevel: isProduction ? "error" : "debug",
            },
        ],
    });
    configured = true;
}

/** Logger for the speedx app. Use after initLogger() has been awaited. */
export const logger = getLogger("speedx");
