# Agent Teams 構成ガイド

本プロジェクト（Simple Diary）における AI Agent Teams の構成・運用指針。

## チーム構成図

```
🎯 Orchestrator（Claude Opus 4.6 / 全体統括・指揮のみ）
├── 📝 Documentation Manager（Claude Sonnet 4.6 / ドキュメント管理・作成）
│     └── [完了報告受信] ← Team Alpha Lead / Team Beta Lead
│     └── [コミット依頼] → Release Manager
├── 🚀 Release Manager（Claude Sonnet 4.6 / Git操作・リリース管理）
├── 🔎 Explorer（Claude Haiku 4.5 / コードベース検索・調査）
│     └── [調査結果] → Orchestrator
├── 🖥️ Team Alpha Lead（Claude Sonnet 4.6 / チームA統括・フロントエンド担当）
│     ├── ⚡ Implementer A（Claude Sonnet 4.6 / フロントエンド実装）
│     └── 🔍 Reviewer A（Codex CLI / コードレビュー）
│           └── [レビュー結果] → Team Alpha Lead
└── ⚙️ Team Beta Lead（Claude Sonnet 4.6 / チームB統括・バックエンド担当）
      ├── ⚡ Implementer B（Claude Sonnet 4.6 / バックエンド実装）
      └── 🔍 Reviewer B（Codex CLI / コードレビュー）
            └── [レビュー結果] → Team Beta Lead
```

## ロール定義

### Orchestrator（1名・Opus 4.6 専用）

| 項目 | 内容 |
|------|------|
| **エンジン** | Claude Opus 4.6（本プロジェクトで唯一の Opus） |
| **役割** | 全体統括、アーキテクチャ判断、タスク分割・割り振り |
| **責務** | 2チームへのタスク配分、チーム間の依存関係調整、品質最終判断 |
| **やらないこと** | コード実装、ドキュメント作成・編集、Git操作、レビュー等の実作業すべて |

### Documentation Manager（1名・Orchestrator 直轄）

| 項目 | 内容 |
|------|------|
| **エンジン** | Claude Sonnet 4.6 |
| **サブエージェント種別** | `general-purpose` |
| **役割** | プロジェクト全体のドキュメント管理・作成・更新 |
| **管轄ファイル** | `CLAUDE.md`、`docs/` 配下すべて（AGENT_TEAMS.md 等） |
| **入力** | Orchestrator からの指示、両チームの Team Lead からの完了報告 |
| **責務** | フェーズ完了サマリー作成、CLAUDE.md 更新、書式・粒度の一貫性維持 |

### Release Manager（1名・Orchestrator 直轄）

| 項目 | 内容 |
|------|------|
| **エンジン** | Claude Sonnet 4.6 |
| **サブエージェント種別** | `general-purpose` |
| **役割** | Git操作の一元管理（commit / push / ブランチ管理） |
| **責務** | コミット作成（適切なメッセージ付与）、リモートへのプッシュ、ブランチ戦略管理 |
| **トリガー** | Orchestrator からの指示、または以下の自動トリガー |
| **自動コミットタイミング** | (1) 各タスク完了時 (2) フェーズ完了時 (3) ドキュメント更新完了時 |
| **コミットルール** | 変更内容を確認し適切な粒度でコミット。機密ファイル(.env等)の除外チェック |

### Explorer（1名・Orchestrator 直轄）

| 項目 | 内容 |
|------|------|
| **エンジン** | Claude Haiku 4.5 |
| **サブエージェント種別** | `Explore` |
| **役割** | 高速コードベース検索、影響範囲調査 |
| **制約** | 読み取り専用。コード変更不可 |

### Team Alpha（フロントエンド担当・3名）

| # | ロール | エンジン | サブエージェント種別 | 担当領域 |
|---|--------|----------|---------------------|----------|
| 1 | **Team Alpha Lead** | Claude Sonnet 4.6 | `general-purpose` | チーム内タスク管理、実装判断、Implementer A への指示 |
| 2 | **Implementer A** | Claude Sonnet 4.6 | `general-purpose` | フロントエンド実装（React/Vite/TypeScript/Tailwind CSS） |
| 3 | **Reviewer A** | Codex CLI | `Bash` | フロントエンドコードレビュー、静的解析、品質チェック |

**担当スコープ**: `frontend/` 配下のすべてのファイル

### Team Beta（バックエンド担当・3名）

| # | ロール | エンジン | サブエージェント種別 | 担当領域 |
|---|--------|----------|---------------------|----------|
| 1 | **Team Beta Lead** | Claude Sonnet 4.6 | `general-purpose` | チーム内タスク管理、実装判断、Implementer B への指示 |
| 2 | **Implementer B** | Claude Sonnet 4.6 | `general-purpose` | バックエンド実装（Express/TypeScript/SQLite） |
| 3 | **Reviewer B** | Codex CLI | `Bash` | バックエンドコードレビュー、静的解析、品質チェック |

**担当スコープ**: `backend/` 配下のすべてのファイル

## モデル使用方針

| モデル | 使用箇所 | 理由 |
|--------|----------|------|
| **Opus 4.6** | Orchestrator のみ | 最高性能。全体統括・判断に専念させコスト効率化 |
| **Sonnet 4.6** | Doc Manager × 1、Release Manager × 1、Team Lead × 2、Implementer × 2 | 実装速度と品質のバランス。並列実行に最適 |
| **Haiku 4.5** | Explorer | 高速・低コスト。検索・調査タスクに十分 |
| **Codex CLI** | Reviewer × 2 | サンドボックス内静的解析。フェーズ完了時レビュー |

## エージェント総数

| 区分 | 人数 | 内訳 |
|------|------|------|
| Orchestrator | 1 | Opus 4.6 |
| 直轄スタッフ | 3 | Documentation Manager (Sonnet)、Release Manager (Sonnet)、Explorer (Haiku) |
| Team Alpha | 3 | Lead + Implementer (Sonnet) + Reviewer (Codex) |
| Team Beta | 3 | Lead + Implementer (Sonnet) + Reviewer (Codex) |
| **合計** | **10** | |

## 2チーム並行運用のルール

### 1. タスク分割原則

Orchestrator がフェーズ開始時にタスクを**依存関係のない2グループ**に分割し、各チームに割り振る。

```
例: 新機能追加の場合
  Team Alpha: フロントエンド実装（Reactコンポーネント、UI、状態管理）
  Team Beta:  バックエンド実装（APIエンドポイント、DB操作、バリデーション）
  Doc Manager: 並行して CLAUDE.md 更新、フェーズ開始記録
  Release Manager: タスク完了ごとにコミット・プッシュ
```

### 2. 依存関係の管理

- **チーム間依存がある場合**: Orchestrator が順序を制御（Beta 完了（API設計確定）→ Alpha 開始）
- **チーム内依存**: Team Lead が管理
- **共有リソース競合**: Orchestrator が調整（同一ファイルの同時編集を防ぐ）
- **ドキュメント更新**: Documentation Manager が一元管理（チームからの直接編集は禁止）
- **Git操作**: Release Manager が一元管理（他エージェントは直接 git コマンドを実行しない）

### 3. ファイル競合防止

2チームが同時に同じファイルを編集しないよう、Orchestrator がファイル所有権を割り当てる。

| パターン | 対応 |
|----------|------|
| 完全独立ファイル（frontend/ vs backend/） | 各チーム自由に編集 |
| 共有ファイル（追記のみ） | 編集順序を指定（Beta 先 → Alpha 後） |
| 共有ファイル（構造変更） | 片方のチームのみに割り当て |
| ドキュメントファイル | Documentation Manager 専任（チームは編集しない） |
| Git操作 | Release Manager 専任（他エージェントは git コマンド禁止） |

### 4. 進捗報告・同期

- Team Lead は各タスク完了時に Orchestrator へ報告
- Orchestrator は Documentation Manager にドキュメント更新を指示
- Orchestrator は Release Manager にコミット・プッシュを指示
- Orchestrator は必要に応じてチーム間の情報共有を実施
- フェーズ完了時は両チームの成果を統合レビュー

## ワークフロー

### 標準パターン

```
1. Orchestrator: タスク分析・分割（Explorer で調査）
2. Orchestrator → Team Alpha: フロントエンドタスク割り振り
   Orchestrator → Team Beta:  バックエンドタスク割り振り（並行開始）
   Orchestrator → Doc Manager: フェーズ開始記録・CLAUDE.md 更新
3. Team Alpha: Lead → Implementer A → Reviewer A（チーム内サイクル）
   Team Beta:  Lead → Implementer B → Reviewer B（チーム内サイクル）
   Doc Manager: 完了報告を受けて随時ドキュメント更新
   Release Manager: タスク完了ごとにコミット・プッシュ
4. Orchestrator: 両チーム成果統合、最終確認
5. Orchestrator → Doc Manager: フェーズ完了サマリー作成、CLAUDE.md 更新
6. Orchestrator → Release Manager: フェーズ完了コミット・プッシュ
7. Orchestrator: フェーズ完了判定
```

### チーム内ワークフロー

```
1. Team Lead: タスク内容を理解、実装方針決定
2. Team Lead → Implementer: 実装指示
3. Implementer: コード実装
4. Team Lead → Reviewer: レビュー依頼
5. Reviewer: Codex CLI でレビュー実施
6. Team Lead: レビュー結果に基づき修正判断
7. Team Lead → Orchestrator: 完了報告
8. Orchestrator → Release Manager: コミット指示
```

### Documentation Manager ワークフロー

```
1. Orchestrator から指示を受信（「フェーズ X 開始を記録して」等）
2. 両チームの Team Lead から完了報告を受信
3. ドキュメント作成・更新（CLAUDE.md, docs/ 配下等）
4. Orchestrator へ更新完了を報告
5. Orchestrator → Release Manager: ドキュメントコミット指示
```

### Release Manager ワークフロー

```
1. Orchestrator からコミット指示を受信
2. git status / git diff で変更内容を確認
3. 適切な粒度でファイルをステージング（機密ファイル除外チェック）
4. コミットメッセージ作成（変更内容を反映した簡潔なメッセージ）
5. コミット実行
6. リモートへプッシュ
7. Orchestrator へ完了報告（コミットハッシュ付き）
```

## 運用ルール

1. **Opus 4.6 は Orchestrator 専用**: コスト最適化のため、実作業には一切使用しない
2. **Orchestrator は指揮のみ**: コード実装、ドキュメント作成、Git操作、レビュー等の実作業は行わない
3. **ドキュメントは Doc Manager 専任**: `CLAUDE.md`・`docs/` 配下の編集権限は Documentation Manager のみ
4. **Git操作は Release Manager 専任**: commit / push / branch 操作は Release Manager のみが実行
5. **フェーズ完了時レビューは必須**: 各チームの Reviewer による完了時レビュー + Orchestrator の最終確認
6. **並列化の原則**: フロントエンド・バックエンドは基本的に並列実行（API仕様が確定していることが前提）
7. **Explorer は Orchestrator 直轄**: 両チームからの調査依頼は Orchestrator 経由で処理
8. **ファイル競合は事前防止**: Orchestrator がタスク割り振り時にファイル所有権を明示
9. **チーム間通信は Orchestrator 経由**: Team Alpha ↔ Team Beta の直接通信は行わない
10. **定義外エージェント禁止**: 本ドキュメントの「ロール定義」に記載されたロール以外のエージェントは起動しないこと。すべての作業は定義済みロール（Orchestrator, Documentation Manager, Release Manager, Explorer, Team Alpha Lead/Implementer/Reviewer, Team Beta Lead/Implementer/Reviewer）のいずれかに割り当てること
