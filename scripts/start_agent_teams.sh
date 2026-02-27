#!/bin/bash
# Agent Teams 起動スクリプト

echo "🚀 Agent Teams を起動します..."

# メッセージキューの初期化
mkdir -p .claude/messages/inbox/{orchestrator,doc-manager,release-manager,explorer,alpha-lead,alpha-implementer,beta-lead,beta-implementer}
mkdir -p .claude/messages/sent
mkdir -p .claude/state
mkdir -p .claude/worktree

# ステータスのリセット
node -e "
const fs = require('fs');
const status = JSON.parse(fs.readFileSync('.claude/state/agent_status.json'));
Object.keys(status.agents).forEach(k => {
  status.agents[k].status = 'idle';
  status.agents[k].current_task = null;
});
status.last_updated = new Date().toISOString();
fs.writeFileSync('.claude/state/agent_status.json', JSON.stringify(status, null, 2));
"

echo "✅ セットアップ完了"
echo ""
echo "次のステップ:"
echo "  1. claude --worktree orchestrator --tmux"
echo "  2. Orchestratorに指示: 'inboxを確認してPhaseを開始してください'"
