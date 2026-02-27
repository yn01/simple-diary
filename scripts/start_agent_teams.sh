#!/bin/bash
# =============================================================================
# Agent Teams 起動スクリプト v2
# 使い方: bash scripts/start_agent_teams.sh
# - 前回メッセージをObsidianにアーカイブしてからinboxをリセット
# - 全エージェントをworktree + tmuxで起動
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "$PROJECT_ROOT")"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

OBSIDIAN_VAULT="/Users/yoheinakanishi/Documents/Obsidian/Claude-Dev"
OBSIDIAN_MESSAGES_DIR="$OBSIDIAN_VAULT/agent-messages"

AGENTS=(
  "orchestrator"
  "doc-manager"
  "release-manager"
  "explorer"
  "alpha-lead"
  "alpha-implementer"
  "beta-lead"
  "beta-implementer"
)

# モデル取得関数（macOS bash 3.2対応のためcase文を使用）
get_model() {
  case "$1" in
    orchestrator)      echo "claude-opus-4-6" ;;
    explorer)          echo "claude-haiku-4-5" ;;
    *)                 echo "claude-sonnet-4-6" ;;
  esac
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agent Teams 起動スクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =============================================================================
# [1/5] 事前チェック
# =============================================================================
echo -e "${YELLOW}[1/5] 事前チェック...${NC}"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}ERROR: Gitリポジトリではありません。git init を実行してください。${NC}"
  exit 1
fi

if ! command -v tmux &> /dev/null; then
  echo -e "${RED}ERROR: tmuxがインストールされていません。brew install tmux を実行してください。${NC}"
  exit 1
fi

if ! command -v claude &> /dev/null; then
  echo -e "${RED}ERROR: claude CLIがインストールされていません。${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 事前チェック完了${NC}"
echo ""

# =============================================================================
# [2/5] 前回メッセージをObsidianにアーカイブ → inboxリセット
# =============================================================================
echo -e "${YELLOW}[2/5] 前回メッセージのアーカイブ...${NC}"

HAS_MESSAGES=false
for agent in "${AGENTS[@]}"; do
  INBOX=".claude/messages/inbox/$agent"
  if [ -d "$INBOX" ]; then
    count=$(find "$INBOX" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      HAS_MESSAGES=true
      break
    fi
  fi
done

if [ "$HAS_MESSAGES" = true ]; then
  TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
  ARCHIVE_DIR="$OBSIDIAN_MESSAGES_DIR/${TIMESTAMP}_${PROJECT_NAME}"
  mkdir -p "$ARCHIVE_DIR"

  for agent in "${AGENTS[@]}"; do
    INBOX=".claude/messages/inbox/$agent"
    if [ -d "$INBOX" ]; then
      count=$(find "$INBOX" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      if [ "$count" -gt 0 ]; then
        mkdir -p "$ARCHIVE_DIR/$agent"
        find "$INBOX" -name "*.md" -exec cp {} "$ARCHIVE_DIR/$agent/" \;
        echo "  ✓ $agent ($count件) → アーカイブ済み"
      fi
    fi
  done

  # sentフォルダも保存
  if [ -d ".claude/messages/sent" ]; then
    count=$(find ".claude/messages/sent" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      mkdir -p "$ARCHIVE_DIR/sent"
      find ".claude/messages/sent" -name "*.md" -exec cp {} "$ARCHIVE_DIR/sent/" \;
      echo "  ✓ sent ($count件) → アーカイブ済み"
    fi
  fi

  echo -e "  ${BLUE}保存先: $ARCHIVE_DIR${NC}"

  # inboxをリセット（.mdファイルのみ削除、.gitkeepは残す）
  for agent in "${AGENTS[@]}"; do
    find ".claude/messages/inbox/$agent" -name "*.md" -delete 2>/dev/null || true
  done
  find ".claude/messages/sent" -name "*.md" -delete 2>/dev/null || true
  echo -e "  ${GREEN}✓ inboxリセット完了${NC}"
else
  echo "  前回のメッセージなし（スキップ）"
fi

echo -e "${GREEN}✓ アーカイブ完了${NC}"
echo ""

# =============================================================================
# [3/5] メッセージキュー・状態初期化
# =============================================================================
echo -e "${YELLOW}[3/5] メッセージキュー初期化...${NC}"

for agent in "${AGENTS[@]}"; do
  mkdir -p ".claude/messages/inbox/$agent"
  touch ".claude/messages/inbox/$agent/.gitkeep"
done
mkdir -p ".claude/messages/sent"
mkdir -p ".claude/state"

if [ ! -f ".claude/state/agent_status.json" ]; then
  cat > ".claude/state/agent_status.json" << 'EOF'
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
EOF
else
  if command -v node &> /dev/null; then
    node -e "
      const fs = require('fs');
      const p = '.claude/state/agent_status.json';
      const s = JSON.parse(fs.readFileSync(p));
      Object.keys(s.agents).forEach(k => { s.agents[k].status = 'idle'; s.agents[k].current_task = null; });
      s.last_updated = new Date().toISOString();
      fs.writeFileSync(p, JSON.stringify(s, null, 2));
    "
  fi
fi

echo -e "${GREEN}✓ メッセージキュー初期化完了${NC}"
echo ""

# =============================================================================
# [4/5] Worktree確認・作成
# =============================================================================
echo -e "${YELLOW}[4/5] Worktree確認...${NC}"

for agent in "${AGENTS[@]}"; do
  WORKTREE_PATH=".claude/worktree/$agent"
  if git worktree list | grep -q "$WORKTREE_PATH"; then
    echo "  ✓ $agent (既存)"
  else
    echo "  + $agent を作成中..."
    git worktree add "$WORKTREE_PATH" -b "worktree/$agent" 2>/dev/null || \
    git worktree add "$WORKTREE_PATH" "worktree/$agent" 2>/dev/null || \
    echo -e "  ${YELLOW}⚠ $agent のworktree作成をスキップ${NC}"
  fi
done

echo -e "${GREEN}✓ Worktree確認完了${NC}"
echo ""

# =============================================================================
# [5/5] エージェント起動
# =============================================================================
echo -e "${YELLOW}[5/5] エージェントを起動します...${NC}"
echo ""
echo "起動するエージェントを選んでください："
echo "  1) 全エージェント（8セッション）"
echo "  2) カスタム（エージェントを個別に選択）"
echo ""
read -p "選択 [1-2]: " choice

LAUNCH_AGENTS=()

case $choice in
  1)
    LAUNCH_AGENTS=("orchestrator" "doc-manager" "release-manager" "explorer" "alpha-lead" "alpha-implementer" "beta-lead" "beta-implementer")
    ;;
  2)
    echo ""
    echo "各エージェントを起動するか選んでください（y/n）："
    for agent in "${AGENTS[@]}"; do
      model="$(get_model $agent)"
      read -p "  $agent (${model}) [y/n]: " yn
      case $yn in
        [Yy]*) LAUNCH_AGENTS+=("$agent") ;;
        *) echo -e "    ${YELLOW}スキップ: $agent${NC}" ;;
      esac
    done

    # Release Managerが未選択の場合はアラート
    if ! echo "${LAUNCH_AGENTS[@]}" | grep -qw "release-manager"; then
      echo ""
      echo -e "${YELLOW}⚠ Release Managerが未選択です。Gitコミット・プッシュは手動で行うか、stop時に対応してください。${NC}"
    fi
    ;;
  *)
    echo -e "${RED}無効な選択です。${NC}"
    exit 1
    ;;
esac

echo ""
echo "起動するエージェント: ${LAUNCH_AGENTS[*]}"
echo ""

for agent in "${LAUNCH_AGENTS[@]}"; do
  model="$(get_model $agent)"
  WORKTREE_PATH="$PROJECT_ROOT/.claude/worktree/$agent"
  echo -e "  🚀 $agent (${model}) を起動中..."
  tmux new-window -n "$agent" "cd '$WORKTREE_PATH' && claude --model $model; exec zsh" 2>/dev/null || \
  tmux new-session -d -s "agents" -n "$agent" "cd '$WORKTREE_PATH' && claude --model $model; exec zsh" 2>/dev/null || \
  echo -e "    ${YELLOW}⚠ 手動起動: cd $WORKTREE_PATH && claude --model $model${NC}"
  sleep 0.5
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  起動完了！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "次のステップ："
echo "  orchestratorセッションで以下を入力："
echo ""
echo -e "${BLUE}  あなたはOrchestratorです。CLAUDE.mdとPLAN.mdを読んで、${NC}"
echo -e "${BLUE}  次のフェーズのタスクを分析し、Team AlphaとTeam Betaに割り振ってください。${NC}"
echo -e "${BLUE}  各エージェントのinboxにメッセージを送信してください。${NC}"
echo ""
echo "終了時: bash scripts/stop_agent_teams.sh"
echo ""

# TODO: MCP移行時
#   - アーカイブ取得元: .claude/messages/ → mcp export_messages()
#   - エージェント起動: tmux手動 → mcp spawn_agent()