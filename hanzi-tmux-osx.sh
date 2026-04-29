#!/bin/bash

tmux new-session -d -s zhongweb

# Backend (Flask)
tmux send-keys -t zhongweb 'cd /Users/paolo/programming/hanzilab/repo/hanzi-backend' C-m
sleep 0.3
tmux send-keys -t zhongweb 'uv run python app.py' C-m

# Frontend (Vue)
tmux split-window -v -t zhongweb
tmux send-keys -t zhongweb.1 'cd /Users/paolo/programming/hanzilab/repo/hanzi-frontend' C-m
sleep 0.3
tmux send-keys -t zhongweb.1 'bun run dev' C-m

# Search backend
tmux split-window -h -t zhongweb.1
tmux send-keys -t zhongweb.2 'cd /Users/paolo/programming/hanzilab/repo/hanzi-search' C-m
sleep 0.3
tmux send-keys -t zhongweb.2 'uv run python app.py' C-m

tmux select-pane -t zhongweb.0
tmux attach-session -t zhongweb
