#!/bin/bash
# =============================================================================
# Agent Teams 停止スクリプト
# 使い方: bash scripts/stop_agent_teams.sh
# - メッセージキューをObsidianにアーカイブ
# - Release Managerの起動状態を確認してGitコミットをアラート
# - 全tmuxセッションを終了
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Agent Teams 停止スクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# =============================================================================
# [1/4] Release Manager 起動確認
# =============================================================================
echo -e "${YELLOW}[1/4] Release Manager 起動確認...${NC}"

RELEASE_MANAGER_RUNNING=false

# tmuxウィンドウで確認
if tmux list-windows 2>/dev/null | grep -q "release-manager"; then
  RELEASE_MANAGER_RUNNING=true
fi

# tmuxセッションでも確認
if tmux list-sessions 2>/dev/null | grep -q "release-manager"; then
  RELEASE_MANAGER_RUNNING=true
fi

if [ "$RELEASE_MANAGER_RUNNING" = false ]; then
  echo ""
  echo -e "${RED}========================================${NC}"
  echo -e "${RED}  ⚠️  警告: Release Manager が未起動です${NC}"
  echo -e "${RED}========================================${NC}"
  echo ""
  echo -e "${YELLOW}Gitコミット・プッシュが実行されていない可能性があります。${NC}"
  echo ""
  echo "対応オプション："
  echo "  1) Release Managerを今すぐ起動してコミットしてから停止する"
  echo "  2) このまま停止する（後で手動でgit commit & push）"
  echo "  3) キャンセル（停止しない）"
  echo ""
  read -p "選択 [1-3]: " git_choice

  case $git_choice in
    1)
      WORKTREE_PATH="$PROJECT_ROOT/.claude/worktree/release-manager"
      echo -e "  🚀 Release Manager を起動します..."
      tmux new-window -n "release-manager" "cd '$WORKTREE_PATH' && claude --model claude-sonnet-4-6; exec zsh" 2>/dev/null || \
      tmux new-session -d -s "agents" -n "release-manager" "cd '$WORKTREE_PATH' && claude --model claude-sonnet-4-6; exec zsh" 2>/dev/null
      echo ""
      echo -e "${YELLOW}Release Managerのセッションで以下を入力してコミット・プッシュを完了させてください：${NC}"
      echo ""
      echo -e "${BLUE}  あなたはRelease Managerです。現在の変更をすべてコミット・プッシュしてください。${NC}"
      echo ""
      read -p "コミット・プッシュが完了したらEnterを押してください..."
      ;;
    2)
      echo -e "${YELLOW}⚠ 停止後に手動でコミット・プッシュを実行してください：${NC}"
      echo "  git add -A && git commit -m 'your message' && git push"
      ;;
    3)
      echo "キャンセルしました。"
      exit 0
      ;;
    *)
      echo -e "${RED}無効な選択です。停止を中止します。${NC}"
      exit 1
      ;;
  esac
else
  echo -e "${GREEN}✓ Release Manager は起動中です${NC}"
  echo ""
  echo -e "${YELLOW}停止前に、Release Managerのセッションで最終コミット・プッシュが完了していることを確認してください。${NC}"
  read -p "確認できたらEnterを押してください..."
fi

echo ""

# =============================================================================
# [2/4] メッセージキューをObsidianにアーカイブ
# =============================================================================
echo -e "${YELLOW}[2/4] メッセージキューをObsidianにアーカイブ...${NC}"

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

  TOTAL=0
  for agent in "${AGENTS[@]}"; do
    INBOX=".claude/messages/inbox/$agent"
    if [ -d "$INBOX" ]; then
      count=$(find "$INBOX" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
      if [ "$count" -gt 0 ]; then
        mkdir -p "$ARCHIVE_DIR/$agent"
        find "$INBOX" -name "*.md" -exec cp {} "$ARCHIVE_DIR/$agent/" \;
        echo "  ✓ $agent ($count件)"
        TOTAL=$((TOTAL + count))
      fi
    fi
  done

  if [ -d ".claude/messages/sent" ]; then
    count=$(find ".claude/messages/sent" -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -gt 0 ]; then
      mkdir -p "$ARCHIVE_DIR/sent"
      find ".claude/messages/sent" -name "*.md" -exec cp {} "$ARCHIVE_DIR/sent/" \;
      echo "  ✓ sent ($count件)"
      TOTAL=$((TOTAL + count))
    fi
  fi

  echo ""
  echo -e "  ${GREEN}合計 ${TOTAL}件 → $ARCHIVE_DIR${NC}"
else
  echo "  メッセージなし（スキップ）"
fi

echo -e "${GREEN}✓ アーカイブ完了${NC}"
echo ""

# =============================================================================
# [3/4] agent_status.jsonを最終状態として保存
# =============================================================================
echo -e "${YELLOW}[3/4] 状態ファイルを保存...${NC}"

if [ -f ".claude/state/agent_status.json" ] && [ "$HAS_MESSAGES" = true ]; then
  cp ".claude/state/agent_status.json" "$ARCHIVE_DIR/agent_status_final.json"
  echo -e "${GREEN}✓ agent_status.json → アーカイブに保存${NC}"
fi
echo ""

# =============================================================================
# [4/4] 全tmuxセッション終了
# =============================================================================
echo -e "${YELLOW}[4/4] 全tmuxセッションを終了...${NC}"

CLOSED=0
for agent in "${AGENTS[@]}"; do
  # ウィンドウを閉じる
  if tmux list-windows 2>/dev/null | grep -q "^.*:$agent "; then
    tmux kill-window -t "$agent" 2>/dev/null && echo "  ✓ $agent セッション終了" && CLOSED=$((CLOSED + 1)) || true
  fi
done

# "agents"セッション全体を終了（ウィンドウが残っている場合）
if tmux has-session -t agents 2>/dev/null; then
  tmux kill-session -t agents 2>/dev/null && echo "  ✓ agentsセッション終了" || true
fi

# agent-* 個別セッションも終了
for agent in "${AGENTS[@]}"; do
  if tmux has-session -t "agent-$agent" 2>/dev/null; then
    tmux kill-session -t "agent-$agent" 2>/dev/null && echo "  ✓ agent-$agent セッション終了" || true
  fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Agent Teams 停止完了${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "アーカイブ先:"
echo "  Obsidian: $OBSIDIAN_MESSAGES_DIR"
echo ""
if [ "$RELEASE_MANAGER_RUNNING" = false ]; then
  echo -e "${YELLOW}⚠ 未コミットの変更がある場合は手動でpushしてください${NC}"
  echo "  git status"
  echo "  git add -A && git commit -m 'message' && git push"
  echo ""
fi

# TODO: MCP移行時
#   - アーカイブ取得元: .claude/messages/ → mcp export_messages()
#   - セッション終了: tmux kill → mcp terminate_agents()