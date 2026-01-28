# SPEEDX (Prometheus Data Exporter)

A system metrics exporter built with Bun that collects and exports machine performance metrics.

## 🚀 Prerequisites

- Bun 1.3.7+
- macOS 

## 🛠️ Getting Started

1. **Development Commands**
    ```bash
    # Install dependencies
    bun install

    # Run in development mode
    bun run index.ts
    ```

2. **Compile to Executable**
    ```bash
    # Compile to binary
    bun build --compile --target=bun-darwin-arm64 ./src/index.ts --outfile exporter

    # Make executable and install
    chmod +x ./exporter
    sudo mv exporter /usr/local/bin/exporter

    # Load as system service (optional)
    launchctl load ~/Library/LaunchAgents/com.hkt.exporter.plist 

    # Verify plist format
    plutil -lint ~/Library/LaunchAgents/com.hkt.exporter.plist
    ```

## Metrics List

### Memory Metrics
- `machine_memory_total` - Total system memory
- `machine_memory_free` - Available free memory
- `machine_memory_used` - Currently used memory
- `machine_memory_active` - Active memory pages
- `machine_memory_buffcache` - Buffer/cache memory
- `machine_memory_reclaimable` - Reclaimable memory
- `machine_memory_available` - Available memory for applications
- `machine_memory_swaptotal` - Total swap space
- `machine_memory_swapused` - Used swap space
- `machine_memory_swapfree` - Free swap space

## 🚨 Troubleshooting

- **Permission denied**: Ensure the binary has execute permissions with `chmod +x`
- **Command not found**: Verify `/usr/local/bin` is in your PATH
- **Plist errors**: Use `plutil -lint` to validate the plist file format

## 🔖 References

- [Bun Documentation](https://bun.sh/docs)
- [macOS launchctl Guide](https://www.launchd.info/)

## 📄 License

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
