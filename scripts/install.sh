#!/usr/bin/env bash
# Install / uninstall the HKT Prometheus exporter on macOS (host LaunchDaemon).
# Requires: public GitHub release access, sudo.
set -euo pipefail

BIN_NAME="hkt-prom-exporter-darwin-arm64"
BIN_DST="/usr/local/bin/${BIN_NAME}"
PLIST_NAME="com.hkt.exporter.plist"
# Dest name kept for machines already installed from hkt-ai-monitoring.
PLIST_DST="/Library/LaunchDaemons/com.hkt.hkt-prom-exporter.plist"
LABEL="com.hkt.prom.exporter"
METRICS_PORT="28872"
RELEASE_URL="https://github.com/ipts-infrastructure/speedx/releases/latest/download/${BIN_NAME}"
PLIST_URL="https://raw.githubusercontent.com/ipts-infrastructure/speedx/main/${PLIST_NAME}"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/install.sh [install]
  ./scripts/install.sh uninstall

Installs the HKT exporter binary to /usr/local/bin and enables the LaunchDaemon.
After load, curls /metrics on this machine's Tailscale IPv4 (not only localhost).
Requires macOS Apple Silicon (arm64), sudo, Tailscale, and a reachable public GitHub release.
EOF
}

require_macos_arm64() {
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "error: this installer only supports macOS" >&2
    exit 1
  fi
  if [[ "$(uname -m)" != "arm64" ]]; then
    echo "error: only darwin-arm64 binary is published; this machine is $(uname -m)" >&2
    exit 1
  fi
}

local_plist() {
  if [[ -n "${BASH_SOURCE[0]:-}" && -f "${BASH_SOURCE[0]}" ]]; then
    local root
    root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    if [[ -f "${root}/${PLIST_NAME}" ]]; then
      echo "${root}/${PLIST_NAME}"
      return 0
    fi
  fi
  return 1
}

find_tailscale() {
  if command -v tailscale >/dev/null 2>&1; then
    command -v tailscale
    return 0
  fi
  local p
  for p in \
    /Applications/Tailscale.app/Contents/MacOS/Tailscale \
    /usr/local/bin/tailscale \
    /opt/homebrew/bin/tailscale
  do
    if [[ -x "${p}" ]]; then
      echo "${p}"
      return 0
    fi
  done
  return 1
}

metrics_url() {
  echo "http://${1}:${METRICS_PORT}/metrics"
}

wait_for_metrics() {
  local url="$1"
  local i
  for i in $(seq 1 15); do
    if curl -fsS --connect-timeout 1 --max-time 2 "${url}" >/dev/null; then
      return 0
    fi
    sleep 1
  done
  return 1
}

verify_tailscale_metrics() {
  local local_url ts_bin ts_ip ts_url
  local_url="$(metrics_url 127.0.0.1)"
  if ! wait_for_metrics "${local_url}"; then
    echo "error: exporter did not become ready on ${local_url}" >&2
    exit 1
  fi

  if ! ts_bin="$(find_tailscale)"; then
    echo "error: tailscale CLI not found; cannot prove :${METRICS_PORT} on a Tailscale address" >&2
    exit 1
  fi

  if ! ts_ip="$("${ts_bin}" ip -4 | head -n1)" || [[ -z "${ts_ip}" ]]; then
    echo "error: no Tailscale IPv4; cannot prove :${METRICS_PORT} on a Tailscale address" >&2
    exit 1
  fi

  ts_url="$(metrics_url "${ts_ip}")"
  if ! curl -fsS --connect-timeout 2 --max-time 5 "${ts_url}" >/dev/null; then
    echo "error: ${local_url} is up, but ${ts_url} is not reachable" >&2
    exit 1
  fi

  echo "Done. Metrics reachable at ${ts_url}"
}

install_exporter() {
  require_macos_arm64

  local bin_tmp plist_src plist_tmp=""
  bin_tmp="$(mktemp -t hkt-prom-exporter.XXXXXX)"
  # shellcheck disable=SC2064
  trap "rm -f '${bin_tmp}'" EXIT

  if plist_src="$(local_plist)"; then
    :
  else
    plist_tmp="$(mktemp -t hkt-exporter-plist.XXXXXX)"
    trap "rm -f '${bin_tmp}' '${plist_tmp}'" EXIT
    echo "Downloading ${PLIST_NAME}..."
    curl -fL --retry 3 -o "${plist_tmp}" "${PLIST_URL}"
    plist_src="${plist_tmp}"
  fi

  echo "Downloading ${BIN_NAME}..."
  curl -fL --retry 3 -o "${bin_tmp}" "${RELEASE_URL}"
  chmod +x "${bin_tmp}"

  echo "Installing binary to ${BIN_DST} (sudo)..."
  sudo mkdir -p /usr/local/bin
  sudo mv "${bin_tmp}" "${BIN_DST}"
  trap - EXIT
  if [[ -n "${plist_tmp}" ]]; then
    trap "rm -f '${plist_tmp}'" EXIT
  fi

  echo "Installing LaunchDaemon ${PLIST_DST} (sudo)..."
  sudo cp "${plist_src}" "${PLIST_DST}"
  sudo chown root:wheel "${PLIST_DST}"
  sudo chmod 644 "${PLIST_DST}"
  plutil -lint "${PLIST_DST}"

  if sudo launchctl list 2>/dev/null | grep -q "${LABEL}"; then
    sudo launchctl unload -w "${PLIST_DST}" 2>/dev/null || true
  fi
  sudo launchctl load -w "${PLIST_DST}"

  verify_tailscale_metrics
}

uninstall_exporter() {
  require_macos_arm64

  if [[ -f "${PLIST_DST}" ]]; then
    echo "Unloading LaunchDaemon (sudo)..."
    sudo launchctl unload -w "${PLIST_DST}" 2>/dev/null || true
    sudo rm -f "${PLIST_DST}"
  else
    echo "LaunchDaemon not installed (${PLIST_DST})"
  fi

  if [[ -f "${BIN_DST}" ]]; then
    echo "Removing binary ${BIN_DST} (sudo)..."
    sudo rm -f "${BIN_DST}"
  else
    echo "Binary not installed (${BIN_DST})"
  fi

  echo "Uninstall complete."
}

cmd="${1:-install}"
case "${cmd}" in
  install) install_exporter ;;
  uninstall) uninstall_exporter ;;
  -h|--help|help) usage ;;
  *)
    echo "error: unknown command: ${cmd}" >&2
    usage >&2
    exit 1
    ;;
esac
