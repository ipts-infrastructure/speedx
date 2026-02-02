# SPEEDX (Prometheus Data Exporter)

A system metrics exporter built with Bun that collects and exports comprehensive machine performance metrics in Prometheus format.

## 🚀 Prerequisites

- Bun 1.3.7+
- macOS (Darwin ARM64)

## 🛠️ Getting Started

1. **Install Dependencies**
   ```bash
   cd src
   bun install
   ```

2. **Development Mode**
   ```bash
   # Run with default settings
   bun run index.ts
   
   # Run with custom configuration
   bun run index.ts --port 8872 --ci 5000 --logPath /var/log/speedx.log --logMaxSize 5242880
   ```

3. **Production Build**
   ```bash
   # Compile to binary
   bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile hkt-prom-exporter
   
   # Install system-wide
   chmod +x ./hkt-prom-exporter
   sudo mv hkt-prom-exporter /usr/local/bin/hkt-prom-exporter
   ```

4. **System Service Setup**
   ```bash
   # Copy plist file to LaunchAgents
   cp com.hkt.hkt-prom-exporter.plist ~/Library/LaunchAgents/
   
   # Validate plist format
   plutil -lint ~/Library/LaunchAgents/com.hkt.hkt-prom-exporter.plist
   
   # Load service
   launchctl load ~/Library/LaunchAgents/com.hkt.hkt-prom-exporter.plist
   
   # Unload service
   launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.hkt.hkt-prom-exporter.plist
   ```

5. **Access Metrics**
   ```bash
   # View metrics endpoint
   curl http://localhost:8872/metrics
   ```

## Command Line Options

- `--port`: HTTP server port (default: 8872)
- `--ci`: Metrics collection interval in ms (default: 5000)
- `--logPath`: Log file path (default: /var/log/speedx.log)
- `--logMaxSize`: Max log file size in bytes (default: 5242880)

## Exported Metrics

The exporter provides comprehensive system metrics including:

- **System Info**: Hardware, OS, timezone, UUID information
- **CPU**: Temperature, load, speed, cache details
- **Memory**: Usage, swap, layout information
- **Storage**: Disk I/O, filesystem stats, block devices
- **Network**: Interface stats, connections, WiFi networks
- **Processes**: Running processes, system load
- **Hardware**: Graphics controllers, USB devices, battery status

## 🚨 Troubleshooting

- **Permission denied**: Ensure binary has execute permissions with `chmod +x`
- **Command not found**: Verify `/usr/local/bin` is in your PATH
- **Port in use**: Change port with `--port` option
- **Log file errors**: Ensure write permissions for log directory
- **Plist errors**: Validate with `plutil -lint` command

## 🔖 References

- [Bun Documentation](https://bun.sh/docs)
- [Prometheus Metrics Format](https://prometheus.io/docs/instrumenting/exposition_formats/)
- [macOS launchctl Guide](https://www.launchd.info/)
- [systeminformation Package](https://systeminformation.io/)

## 📄 License

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
