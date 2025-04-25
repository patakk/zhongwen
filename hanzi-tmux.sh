#!/bin/bash

tmux new-session -d -s zhongweb

tmux send-keys -t zhongweb 'cd /mnt/d/all/python/chinese/zhongweb/hanzi-backend' C-m
sleep 0.3
tmux send-keys -t zhongweb 'china' C-m
sleep 0.3
tmux send-keys -t zhongweb 'python app.py' C-m

tmux split-window -v -t zhongweb
tmux send-keys -t zhongweb.1 'cd /mnt/d/all/python/chinese/zhongweb/hanzi-frontend' C-m
sleep 0.3
tmux send-keys -t zhongweb.1 'npm run dev' C-m

tmux split-window -h -t zhongweb.1
tmux send-keys -t zhongweb.2 'cd /mnt/d/all/python/chinese/zhongweb/hanzi-search' C-m
sleep 0.3
tmux send-keys -t zhongweb.2 'china' C-m
sleep 0.3
tmux send-keys -t zhongweb.2 'python app.py' C-m

tmux select-pane -t zhongweb.0
tmux attach-session -t zhongweb

