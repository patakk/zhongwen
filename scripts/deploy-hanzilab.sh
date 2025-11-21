#!/bin/bash

export PATH="$HOME/.local/bin:$PATH"

REPO="git@github.com:patakk/zhongwen.git"
LOG_FILE="/home/patakk/logs/deploy-hanzilab.log"
PROJECT_DIR="/home/patakk/hanzilab"
REPO_DIR="$PROJECT_DIR/repo"
FRONTEND_DIR="$REPO_DIR/hanzi-frontend"
BACKEND_DIR="$REPO_DIR/hanzi-backend"
SEARCH_DIR="$REPO_DIR/hanzi-search"
HANZIPY_DIR="$PROJECT_DIR/hanzipy"
HANZIPY_REPO="git@github.com:patakk/hanzipy.git"
ssh-add ~/.ssh/macpro >> $LOG_FILE 2>&1

HANZIPY_BRANCH="main"
FRONTEND_DEPLOY_DIR="/var/www/hanzi-frontend"

mkdir -p "$(dirname "$LOG_FILE")"

echo "$(date): Starting hanzi.abcrgb.xyz deployment" >> $LOG_FILE

if [ -d "$REPO_DIR/.git" ]; then
    echo "$(date): Pulling main repo..." >> $LOG_FILE
    cd "$REPO_DIR"
    git fetch origin master >> $LOG_FILE 2>&1
    git diff --name-only HEAD origin/master > /tmp/changed_files.txt
    git pull origin master >> $LOG_FILE 2>&1
else
    echo "$(date): Cloning main repo..." >> $LOG_FILE
    git clone --branch master "$REPO" "$REPO_DIR" >> $LOG_FILE 2>&1
    cd "$REPO_DIR"
fi

git rev-parse --short HEAD > "$REPO_DIR/version"
echo "Setting version" >> $LOG_FILE
git rev-parse --short HEAD >> $LOG_FILE

CHANGED=$(cat /tmp/changed_files.txt)

# Update or clone hanzipy
if [ -d "$HANZIPY_DIR/.git" ]; then
    echo "$(date): Pulling latest hanzipy..." >> $LOG_FILE
    cd "$HANZIPY_DIR"
    git pull origin $HANZIPY_BRANCH >> $LOG_FILE 2>&1
    cd "$REPO_DIR"
else
    echo "$(date): Cloning hanzipy..." >> $LOG_FILE
    git clone --branch $HANZIPY_BRANCH "$HANZIPY_REPO" "$HANZIPY_DIR" >> $LOG_FILE 2>&1
fi

# FRONTEND
if echo "$CHANGED" | grep -q "^hanzi-frontend/"; then
    echo "$(date): Frontend changed, syncing dist/" >> $LOG_FILE
    sudo rsync -a --delete "$FRONTEND_DIR/dist/" "$FRONTEND_DEPLOY_DIR/" >> $LOG_FILE 2>&1
    echo "$(date): Frontend dist/ synced successfully." >> $LOG_FILE
else
    echo "$(date): No changes detected in frontend." >> $LOG_FILE
fi

# BACKEND
if echo "$CHANGED" | grep -q "^hanzi-backend/"; then
    echo "$(date): Backend changed, installing with Poetry..." >> $LOG_FILE
    cd "$BACKEND_DIR"
    poetry install --no-root >> $LOG_FILE 2>&1
    
    # Run database migrations
    echo "$(date): Running database migrations..." >> $LOG_FILE
    poetry run flask db migrate -m "Auto migration $(date +%Y%m%d%H%M%S)" >> $LOG_FILE 2>&1
    poetry run flask db upgrade >> $LOG_FILE 2>&1
    echo "$(date): Database migrations completed." >> $LOG_FILE
    
    sudo /bin/systemctl restart hanzilab >> $LOG_FILE 2>&1
    echo "$(date): Backend service restarted successfully." >> $LOG_FILE
else
    echo "$(date): No changes detected in backend." >> $LOG_FILE
fi

# SEARCH
if echo "$CHANGED" | grep -q "^hanzi-search/" || echo "$CHANGED" | grep -q "^hanzipy/"; then
    echo "$(date): Search backend or hanzipy changed, installing with Poetry..." >> $LOG_FILE
    cd "$SEARCH_DIR"
    poetry install --no-root >> $LOG_FILE 2>&1
    sudo /bin/systemctl restart hanzilab_search >> $LOG_FILE 2>&1
    echo "$(date): Search service restarted successfully." >> $LOG_FILE
else
    echo "$(date): No changes detected in search backend or hanzipy." >> $LOG_FILE
fi

echo "$(date): Deployment completed" >> $LOG_FILE
