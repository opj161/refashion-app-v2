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

if [ "$MEGA_BACKUP_ENABLED" = "true" ]; then
    echo "MEGA backup is enabled."

    # Robust cleanup: Attempt graceful quit, then kill any lingering processes.
    # Finally, remove and recreate the .megaCmd directory to ensure no stale files.
    echo "Performing cleanup of old MEGAcmd server processes and lock files..."
    mega-quit 2>/dev/null || pkill -9 -f mega-cmd-server || true
    rm -rf /home/appuser/.megaCmd
    mkdir -p /home/appuser/.megaCmd
    echo "Cleanup complete."

    echo "Starting MEGAcmd server..."
    mega-cmd-server &

    # Wait for server initialization
    sleep 8

    # Verify server is running and add enhanced logging on failure
    if ! mega-version > /dev/null 2>&1; then
        echo "Error: MEGAcmd server failed to start properly."
        echo "--- MEGAcmd Server Logs ---"
        cat /home/appuser/.megaCmd/megacmd-server.log 2>/dev/null || echo "Log file not found."
        echo "--------------------------"
        exit 1
    fi

    # Login
    if [ -z "$MEGA_EMAIL" ] || [ -z "$MEGA_PASSWORD" ]; then
        echo "Error: MEGA_EMAIL and MEGA_PASSWORD must be set"
        exit 1
    fi

    echo "Logging in to MEGA..."
    mega-login "$MEGA_EMAIL" "$MEGA_PASSWORD"
    mega-whoami
else
    echo "MEGA backup is disabled."
fi

echo "Running database migrations..."
npm run migrate:prod

echo "Starting application..."
exec "$@"