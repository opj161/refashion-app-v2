#!/bin/sh
set -e

# Cleanup function to be called on SIGTERM/SIGINT
cleanup() {
    echo "Received shutdown signal. Shutting down MEGAcmd server gracefully..."
    mega-quit 2>/dev/null || true
    pkill -f mega-cmd-server 2>/dev/null || true
    echo "MEGAcmd server stopped."
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "Starting MEGAcmd entrypoint script..."

# Ensure machine ID exists for MEGAcmd operations like sync
if [ ! -f /etc/machine-id ]; then
    echo "Generating machine ID for MEGAcmd..."
    if command -v systemd-machine-id-setup >/dev/null 2>&1; then
        systemd-machine-id-setup
    else
        # Fallback for systems without systemd
        uuidgen | tr -d '-' > /etc/machine-id
    fi
fi

if [ "$MEGA_BACKUP_ENABLED" = "true" ]; then
    echo "MEGA backup is enabled."

    # More selective cleanup: target specific lock/state files instead of entire directory
    echo "Performing cleanup of old MEGAcmd server processes and lock files..."
    mega-quit 2>/dev/null || pkill -9 -f mega-cmd-server || true
    
    # Create directory if it doesn't exist, but preserve user preferences
    mkdir -p /home/appuser/.megaCmd
    
    # Remove specific lock files that can cause issues
    rm -f /home/appuser/.megaCmd/.megacmd_server_lock 2>/dev/null || true
    rm -f /home/appuser/.megaCmd/megacmd-server.pid 2>/dev/null || true
    echo "Cleanup complete."

    echo "Starting MEGAcmd server..."
    mega-cmd-server &

    # Robust server readiness check with timeout
    echo "Waiting for MEGAcmd server to initialize..."
    for i in $(seq 1 30); do
        if mega-version > /dev/null 2>&1; then
            echo "MEGAcmd server ready after ${i} seconds"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo "Error: Timeout waiting for MEGAcmd server to start."
            echo "--- MEGAcmd Server Logs ---"
            cat /home/appuser/.megaCmd/megacmd-server.log 2>/dev/null || echo "Log file not found."
            echo "--------------------------"
            exit 1
        fi
    done

    # Login
    if [ -z "$MEGA_EMAIL" ] || [ -z "$MEGA_PASSWORD" ]; then
        echo "Error: MEGA_EMAIL and MEGA_PASSWORD must be set"
        exit 1
    fi

    echo "Logging in to MEGA..."
    if ! mega-login "$MEGA_EMAIL" "$MEGA_PASSWORD"; then
        echo "Error: Failed to login to MEGA account"
        echo "--- MEGAcmd Server Logs ---"
        cat /home/appuser/.megaCmd/megacmd-server.log 2>/dev/null || echo "Log file not found."
        echo "--------------------------"
        exit 1
    fi
    
    mega-whoami
else
    echo "MEGA backup is disabled."
fi

echo "Starting application..."
exec "$@"
