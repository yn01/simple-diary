#!/bin/bash
# =============================================================================
# inbox監視スクリプト
# 使い方: bash scripts/watch_inbox.sh [agent-name]
# - inboxに新しいメッセージが来たら、エージェントがidleの時に自動送信
# - agent_status.jsonでbusy判定し、作業中は待機
# =============================================================================

AGENT_NAME="$1"

if [ -z "$AGENT_NAME" ]; then
  echo "Usage: bash watch_inbox.sh [agent-name]" >&2
  exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INBOX_DIR="$PROJECT_ROOT/.claude/messages/inbox/$AGENT_NAME"
STATUS_FILE="$PROJECT_ROOT/.claude/state/agent_status.json"
PROCESSED_DIR="$PROJECT_ROOT/.claude/messages/processed/$AGENT_NAME"
WATCH_INTERVAL=5  # 監視間隔（秒）
BUSY_WAIT=10      # busy時の再確認間隔（秒）

mkdir -p "$PROCESSED_DIR"

# カラー出力
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[watch:$AGENT_NAME] 監視開始 (inbox: $INBOX_DIR)${NC}" >&2

# =============================================================================
# エージェントのステータス取得
# =============================================================================
get_status() {
  if [ ! -f "$STATUS_FILE" ]; then
    echo "idle"
    return
  fi
  # jqがあれば使う、なければgrepで代用
  if command -v jq &> /dev/null; then
    jq -r ".agents[\"$AGENT_NAME\"].status // \"idle\"" "$STATUS_FILE" 2>/dev/null || echo "idle"
  else
    grep -A2 "\"$AGENT_NAME\"" "$STATUS_FILE" | grep "status" | sed 's/.*: *"\(.*\)".*/\1/' | head -1 || echo "idle"
  fi
}

# =============================================================================
# ステータスをbusyに更新
# =============================================================================
set_status() {
  local new_status="$1"
  if [ ! -f "$STATUS_FILE" ] || ! command -v node &> /dev/null; then
    return
  fi
  node -e "
    const fs = require('fs');
    const p = '$STATUS_FILE';
    try {
      const s = JSON.parse(fs.readFileSync(p));
      if (s.agents['$AGENT_NAME']) {
        s.agents['$AGENT_NAME'].status = '$new_status';
        s.last_updated = new Date().toISOString();
        fs.writeFileSync(p, JSON.stringify(s, null, 2));
      }
    } catch(e) {}
  " 2>/dev/null || true
}

# =============================================================================
# tmuxウィンドウにメッセージを送信
# =============================================================================
send_to_agent() {
  local message_file="$1"
  local message_content
  message_content=$(cat "$message_file")

  # tmuxウィンドウ名でエージェントを特定
  local tmux_target
  tmux_target=$(tmux list-windows 2>/dev/null | grep "$AGENT_NAME" | cut -d: -f1 | head -1)

  if [ -z "$tmux_target" ]; then
    echo -e "${YELLOW}[watch:$AGENT_NAME] tmuxウィンドウが見つかりません。スキップ。${NC}" >&2
    return 1
  fi

  # メッセージを一時ファイルに書き出して読み込ませる（複数行対応）
  local tmp_prompt
  tmp_prompt=$(mktemp /tmp/agent_msg_XXXXXX.txt)
  cat > "$tmp_prompt" << MSGEOF
inboxに新しいメッセージが届いています。以下を読んで指示を実行してください。
完了後はorchestratorのinboxに完了報告を送ってください。

ファイル: $(basename $message_file)
---
$message_content
MSGEOF

  local prompt_text
  prompt_text=$(cat "$tmp_prompt")
  rm -f "$tmp_prompt"

  # 念のため現在の入力をクリア
  tmux send-keys -t "agents:$tmux_target" "" 2>/dev/null ||   tmux send-keys -t "$tmux_target" "" 2>/dev/null
  sleep 0.3

  # テキスト送信（Enterなし）
  tmux send-keys -t "agents:$tmux_target" "$prompt_text" 2>/dev/null ||   tmux send-keys -t "$tmux_target" "$prompt_text" 2>/dev/null
  sleep 0.5

  # Enterを別途送信（確実に実行させる）
  tmux send-keys -t "agents:$tmux_target" "" Enter 2>/dev/null ||   tmux send-keys -t "$tmux_target" "" Enter 2>/dev/null

  echo -e "${GREEN}[watch:$AGENT_NAME] メッセージ送信完了: $(basename $message_file)${NC}" >&2
  return 0
}

# =============================================================================
# 処理済みかどうかチェック
# =============================================================================
is_processed() {
  local file="$1"
  local basename
  basename=$(basename "$file")
  [ -f "$PROCESSED_DIR/$basename" ]
}

# =============================================================================
# 処理済みとしてマーク
# =============================================================================
mark_processed() {
  local file="$1"
  local basename
  basename=$(basename "$file")
  cp "$file" "$PROCESSED_DIR/$basename"
}

# =============================================================================
# メイン監視ループ
# =============================================================================
while true; do
  # inboxの未処理メッセージを検索（タイムスタンプ順）
  if [ -d "$INBOX_DIR" ]; then
    for msg_file in $(find "$INBOX_DIR" -name "*.md" | sort); do

      # 処理済みはスキップ
      if is_processed "$msg_file"; then
        continue
      fi

      echo -e "${YELLOW}[watch:$AGENT_NAME] 新しいメッセージ検出: $(basename $msg_file)${NC}" >&2

      # エージェントがidleになるまで待機
      wait_count=0
      while true; do
        STATUS=$(get_status)
        if [ "$STATUS" = "idle" ]; then
          break
        fi

        wait_count=$((wait_count + 1))
        echo -e "${YELLOW}[watch:$AGENT_NAME] busy中... 待機 ($wait_count回目)${NC}" >&2
        sleep $BUSY_WAIT
      done

      # busyにしてからメッセージ送信
      set_status "busy"

      if send_to_agent "$msg_file"; then
        mark_processed "$msg_file"
      else
        # 送信失敗したらidleに戻す
        set_status "idle"
      fi

    done
  fi

  sleep $WATCH_INTERVAL
done

# TODO: MCP移行時
#   - inbox監視: ファイル監視 → mcp on_message_received() イベント
#   - tmux send-keys: → mcp send_to_agent()