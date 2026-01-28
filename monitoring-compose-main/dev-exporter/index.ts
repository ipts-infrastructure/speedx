// https://medium.com/@tiffanyadisuryo/setting-up-a-prometheus-and-grafana-monitoring-system-for-my-bun-js-backend-243c4c3cd29d

import figlet from 'figlet';
import { register, Gauge, collectDefaultMetrics } from 'prom-client';
import si from 'systeminformation';
import { serve } from 'bun';

// Memory usage gauge
const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

// Update memory metrics
async function updateMemoryMetrics() {
  const mem = await si.mem();
  memoryUsage.set({ type: 'used' }, mem.used);
  memoryUsage.set({ type: 'free' }, mem.free);
  memoryUsage.set({ type: 'total' }, mem.total);
}

// Start server
serve({
  port: 1872,
  async fetch() {
    await updateMemoryMetrics();
    return new Response(await register.metrics(), {
      headers: { 'Content-Type': register.contentType }
    });
  }
});

console.log('Memory exporter running on port 1872');
