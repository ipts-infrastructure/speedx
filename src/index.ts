import { serve } from "bun";
import { register } from "prom-client";

import * as config from "./configs/config";
import { initLogger, logger } from "./utils/logger";
import { registerSysMetrics } from "./metrics/sys";

function createMetricsHandler() {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    if (url.pathname === "/metrics") {
      return new Response(await register.metrics(), {
        headers: { "Content-Type": register.contentType },
      });
    }
    return new Response("Not Found", { status: 404 });
  };
}

async function main() {
  await initLogger();
  registerSysMetrics(register);

  serve({
    port: Number(config.PORT),
    fetch: createMetricsHandler(),
  });
  logger.info("Exporter running on http://localhost:{port}/metrics.", { port: config.PORT });
}

main();
