// https://medium.com/@tiffanyadisuryo/setting-up-a-prometheus-and-grafana-monitoring-system-for-my-bun-js-backend-243c4c3cd29d

import figlet from 'figlet';
import { serve } from 'bun';
import { register } from 'prom-client';

import * as config from './configs/config';
import { registerSysMetrics } from './metrics/sys';

// const exporter = figlet.textSync("SPEEDX", { font: "Standard" });

// console.log(exporter);

registerSysMetrics(register)

// Start server
serve({
  port: config.PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/metrics") {
      // Return metrics in Prometheus format
      return new Response(await register.metrics(), {
        headers: { "Content-Type": register.contentType },
      });
    };
    return new Response("Not Found", { status: 404 });
  },
});

console.log("Exporter running on " + "http://localhost:" + config.PORT+"/metrics.")
