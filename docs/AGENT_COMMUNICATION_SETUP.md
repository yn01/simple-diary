# Agent間通信システム セットアップ指示

## 概要

本指示は、Agent Teamsのセッション間通信をファイルベースのメッセージキューで実装するためのものです。
将来的なMCP（Model Context Protocol）への移行を考慮した設計とします。

---

## Step 1: ディレクトリ構造の作成

以下のディレクトリ・ファイル構造を `.claude/` 配下に作成してください。

```
.claude/
├── messages/
│   ├── inbox/
│   │   ├── orchestrator/
│   │   ├── doc-manager/
│   │   ├── release-manager/
│   │   ├── explorer/
│   │   ├── alpha-lead/
│   │   ├── alpha-implementer/
│   │   ├── beta-lead/
│   │   └── beta-implementer/
│   └── sent/
│       └── .gitkeep
├── state/
│   ├── agent_status.json
│   └── task_registry.json
└── worktree/
    └── .gitkeep
```

各inboxディレクトリに `.gitkeep` ファイルを置いてGit管理できるようにしてください。

---

## Step 2: メッセージフォーマットの定義

`messages/inbox/{宛先エージェント}/` にファイルを置く形式とします。

### ファイル命名規則

```
{timestamp}_{from}_{subject}.md
例: 20250223_143022_orchestrator_task-assignment.md
```

### メッセージファイルの内容フォーマット

```markdown
---
from: orchestrator
to: alpha-lead
timestamp: 2025-02-23T14:30:22
priority: high
status: unread
message_id: msg_001
reply_to: null
---

## 指示内容

（ここにタスク内容を記述）

## 期待するアクション

（ここに期待するアウトプットを記述）

## 完了報告先

orchestrator
```

---

## Step 3: 状態管理ファイルの初期化

### `state/agent_status.json` の初期内容

```json
{
  "last_updated": "",
  "agents": {
    "orchestrator":       { "status": "idle", "current_task": null, "worktree": "orchestrator" },
    "doc-manager":        { "status": "idle", "current_task": null, "worktree": "doc-manager" },
    "release-manager":    { "status": "idle", "current_task": null, "worktree": "release-manager" },
    "explorer":           { "status": "idle", "current_task": null, "worktree": "explorer" },
    "alpha-lead":         { "status": "idle", "current_task": null, "worktree": "alpha-lead" },
    "alpha-implementer":  { "status": "idle", "current_task": null, "worktree": "alpha-implementer" },
    "beta-lead":          { "status": "idle", "current_task": null, "worktree": "beta-lead" },
    "beta-implementer":   { "status": "idle", "current_task": null, "worktree": "beta-implementer" }
  }
}
```

### `state/task_registry.json` の初期内容

```json
{
  "current_phase": null,
  "tasks": []
}
```

---

## Step 4: 各エージェントのCLAUDE.mdにルールを追記

各worktreeのCLAUDE.mdに以下のセクションを追加してください。

```markdown
## Agent間通信ルール

### メッセージの確認（セッション開始時・タスク完了時に実行）

\`\`\`bash
ls .claude/messages/inbox/{自分のエージェント名}/
\`\`\`

未読メッセージがあれば内容を読み、指示に従って行動する。
読んだメッセージは `status: unread` → `status: read` に更新する。

### メッセージの送信方法

\`\`\`bash
# 例: alpha-leadからorchestratorへ完了報告
cat > .claude/messages/inbox/orchestrator/$(date +%Y%m%d_%H%M%S)_alpha-lead_task-complete.md << 'EOF'
---
from: alpha-lead
to: orchestrator
timestamp: $(date -u +%Y-%m-%dT%H:%M:%S)
priority: normal
status: unread
message_id: msg_XXX
reply_to: msg_001
---

## 完了報告

（完了内容を記述）
EOF
\`\`\`

### ステータスの更新

タスク開始時・完了時に `state/agent_status.json` を更新する。
```

---

## Step 5: 起動スクリプトの作成

`scripts/start_agent_teams.sh` を作成してください。

```bash
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
```

---

## MCP移行時の注意事項（将来対応）

このファイルベース実装は、MCP対応が可能になった時点でスムーズに移行できるよう設計しています。

### 移行時の対応箇所

| 現在（ファイルベース） | 移行後（MCP） |
|----------------------|--------------|
| `ls inbox/` でメッセージ確認 | MCPツール `check_messages()` に置換 |
| ファイル書き込みで送信 | MCPツール `send_message()` に置換 |
| `agent_status.json` 更新 | MCPツール `update_status()` に置換 |
| 手動でのファイル監視 | MCPのイベント通知に置換 |

### 移行しなくていいもの

- メッセージのフォーマット（frontmatter形式）はそのまま流用可能
- `task_registry.json` の構造はMCP移行後も参照可能
- Agent Teams全体の役割・ワークフロー定義（AGENT_TEAMS.md）は変更不要

---

## 動作確認

セットアップ後、以下を実行して確認してください。

```bash
# ディレクトリ構造の確認
find .claude -type d | sort

# テストメッセージの送信
cat > .claude/messages/inbox/orchestrator/test_system_setup-complete.md << 'EOF'
---
from: system
to: orchestrator
timestamp: 2025-02-23T00:00:00
priority: normal
status: unread
message_id: msg_000
reply_to: null
---

## システム通知

Agent間通信システムのセットアップが完了しました。
このメッセージが読めれば正常に動作しています。
EOF

echo "✅ テストメッセージ送信完了"
ls .claude/messages/inbox/orchestrator/
```
