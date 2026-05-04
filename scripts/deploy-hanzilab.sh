#!/bin/bash

set -o pipefail

export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"

REPO="git@github.com:patakk/zhongwen.git"
LOG_DIR="/home/patakk/logs"
DEPLOY_LOG_DIR="$LOG_DIR/hanzilab-deploys"
MIGRATION_LOG_DIR="$LOG_DIR/hanzilab-migrations"
DEPLOY_TIMESTAMP="$(date '+%Y-%m-%d_%H-%M-%S')"
LOG_FILE="$DEPLOY_LOG_DIR/$DEPLOY_TIMESTAMP.log"
LOCK_FILE="/tmp/deploy-hanzilab.lock"
PROJECT_DIR="/home/patakk/projects/hanzilab"
REPO_DIR="$PROJECT_DIR/repo"
FRONTEND_DIR="$REPO_DIR/hanzi-frontend"
BACKEND_DIR="$REPO_DIR/hanzi-backend"
SEARCH_DIR="$REPO_DIR/hanzi-search"
HANZIPY_DIR="$PROJECT_DIR/hanzipy"
HANZIPY_REPO="git@github.com:patakk/hanzipy.git"
HANZIPY_BRANCH="main"
FRONTEND_DEPLOY_DIR="/var/www/hanzi-frontend"

mkdir -p "$DEPLOY_LOG_DIR" "$MIGRATION_LOG_DIR"

log() { echo "$(date '+%Y-%m-%d %H:%M:%S'): $*" >> "$LOG_FILE"; }

# Prevent concurrent deploys
if [ -f "$LOCK_FILE" ]; then
    log "Deploy already in progress (lock file exists), aborting."
    exit 1
fi
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

DEPLOYED=""

log "Starting hanzi.abcrgb.xyz deployment"

# Pull main repo
if [ -d "$REPO_DIR/.git" ]; then
    log "Pulling main repo..."
    cd "$REPO_DIR"
    git fetch origin master >> "$LOG_FILE" 2>&1
    CHANGED=$(git diff --name-only HEAD origin/master)
    git pull origin master >> "$LOG_FILE" 2>&1
else
    log "Cloning main repo..."
    git clone --branch master "$REPO" "$REPO_DIR" >> "$LOG_FILE" 2>&1
    cd "$REPO_DIR"
    CHANGED=""
fi

git rev-parse --short HEAD > "$REPO_DIR/version"
log "Version: $(cat "$REPO_DIR/version")"

# Pull hanzipy
if [ -d "$HANZIPY_DIR/.git" ]; then
    log "Pulling hanzipy..."
    cd "$HANZIPY_DIR" && git pull origin "$HANZIPY_BRANCH" >> "$LOG_FILE" 2>&1
    cd "$REPO_DIR"
else
    log "Cloning hanzipy..."
    git clone --branch "$HANZIPY_BRANCH" "$HANZIPY_REPO" "$HANZIPY_DIR" >> "$LOG_FILE" 2>&1
fi

# FRONTEND
if echo "$CHANGED" | grep -q "^hanzi-frontend/"; then
    log "Frontend changed, syncing dist/..."
    if [ ! -d "$FRONTEND_DIR/dist" ]; then
        log "ERROR: $FRONTEND_DIR/dist not found, aborting frontend deploy."
        exit 1
    fi
    if sudo rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_DEPLOY_DIR/" >> "$LOG_FILE" 2>&1; then
        log "Frontend deployed successfully."
        DEPLOYED="$DEPLOYED frontend"
    else
        log "ERROR: Frontend rsync failed."
    fi
else
    log "No frontend changes."
fi

# BACKEND
if echo "$CHANGED" | grep -q "^hanzi-backend/"; then
    log "Backend changed, installing deps..."
    cd "$BACKEND_DIR"

    if ! uv sync >> "$LOG_FILE" 2>&1; then
        log "ERROR: uv sync failed, aborting backend deploy."
        exit 1
    fi

    MIGRATION_LOG="$MIGRATION_LOG_DIR/$DEPLOY_TIMESTAMP.log"
    log "Running database migrations (log: $MIGRATION_LOG)..."
    MIGRATION_OUTPUT=$(uv run flask db upgrade 2>&1 | tee "$MIGRATION_LOG")
    MIGRATION_EXIT=$?
    if [ $MIGRATION_EXIT -ne 0 ]; then
        log "ERROR: Migration failed (exit $MIGRATION_EXIT) — see $(basename "$MIGRATION_LOG"). Service NOT restarted."
        exit 1
    fi
    if echo "$MIGRATION_OUTPUT" | grep -q "Running upgrade"; then
        log "Migrations applied — see $(basename "$MIGRATION_LOG")"
        DEPLOYED="$DEPLOYED migrations"
    else
        log "No pending migrations."
    fi

    if sudo /bin/systemctl restart hanzilab >> "$LOG_FILE" 2>&1; then
        log "Backend service restarted."
        DEPLOYED="$DEPLOYED backend"
    else
        log "ERROR: Failed to restart hanzilab service."
    fi
else
    log "No backend changes."
fi

# SEARCH
if echo "$CHANGED" | grep -q "^hanzi-search/" || echo "$CHANGED" | grep -q "^hanzipy/"; then
    log "Search/hanzipy changed, installing deps..."
    cd "$SEARCH_DIR"

    if ! uv sync >> "$LOG_FILE" 2>&1; then
        log "ERROR: uv sync failed, aborting search deploy."
        exit 1
    fi

    if sudo /bin/systemctl restart hanzilab_search >> "$LOG_FILE" 2>&1; then
        log "Search service restarted."
        DEPLOYED="$DEPLOYED search"
    else
        log "ERROR: Failed to restart hanzilab_search service."
    fi
else
    log "No search changes."
fi

if [ -n "$DEPLOYED" ]; then
    log "Deployment complete. Deployed:$DEPLOYED"
else
    log "Deployment complete. Nothing to deploy."
fi
