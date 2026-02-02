# Simple Diary - プロジェクト概要

## プロジェクト概要

シンプルな日記アプリケーション（Webアプリ）

## エージェント構成

### 主エージェント：Claude Code（オーケストレーター）
- プロジェクト全体の管理と調整
- 各サブエージェント・外部エージェントへのタスク割り当て
- 進捗管理とフェーズ間の調整

### サブエージェント（Claude Code内蔵）
- **Explore**: コードベース探索、ファイル・パターン検索、コードベース理解
- **Plan**: 実装計画立案、アーキテクチャ設計、タスク分解
- **Implementation**: コード実装、機能追加、新規ファイル作成
- **TDD Guide**: テスト駆動開発、テストファーストアプローチ、カバレッジ確保
- **E2E Runner**: E2Eテスト生成・実行、Playwright/Vercel Agent Browser使用
- **Refactor Cleaner**: リファクタリング、デッドコード削除、重複コード整理
- **Code Reviewer**: コード品質レビュー、ベストプラクティス確認、保守性評価
- **Security Reviewer**: セキュリティ脆弱性検出、OWASP Top 10チェック、認証・認可確認
- **Build Error Resolver**: ビルドエラー解決、TypeScriptエラー修正、依存関係修正
- **Database Reviewer**: PostgreSQLクエリ最適化、スキーマ設計レビュー、パフォーマンス改善
- **Doc Updater**: ドキュメント・コードマップ更新、README管理

### 外部エージェント（Skills経由）
- **Codex**: 各フェーズのレビュー担当
  - 要件定義レビュー
  - 設計レビュー
  - 実装レビュー
  - テストレビュー
  - ドキュメントレビュー
- **Gemini**: ドキュメント生成担当
  - 要件定義書（REQUIREMENTS.md）
  - 設計書（DESIGN.md）
  - README（README.md）
  - API仕様書（API.md）
  - ユーザーマニュアル（USER_MANUAL.md）
  - 開発者ドキュメント（DEVELOPMENT.md）

---

## 開発原則・ガイドライン

### 要件ヒアリングの原則
- **AskUserQuestion Toolの積極的な使用**
  - 要件や仕様が曖昧な場合は、推測せずに必ずユーザーに確認する
  - 質問は細分化し、具体的で答えやすい形式にする
  - 複数の選択肢を提示し、ユーザーが選択しやすくする
  - 1回のヒアリングで1-4問の質問に絞り、段階的に要件を明確化する

### ヒアリング対象の例
- 技術スタックの選択（フレームワーク、データベース、ホスティングなど）
- 機能の優先順位
- UI/UXの方向性
- 非機能要件（性能、セキュリティ、スケーラビリティ）
- データモデルの詳細
- APIの設計方針

### ヒアリングのタイミング
1. **要件定義フェーズ**: 機能要件、非機能要件の詳細確認
2. **設計フェーズ**: 技術選定、アーキテクチャ方針の確認
3. **実装フェーズ**: 実装の詳細や代替案の選択
4. **テストフェーズ**: テスト方針、カバレッジ目標の確認
5. **デプロイフェーズ**: デプロイ先、環境設定の確認

### ヒアリングの良い例
```
AskUserQuestion:
Q1: "フロントエンドフレームワークはどれを使用しますか？"
選択肢:
- Next.js (推奨): SSR対応、App Router、最新機能
- React + Vite: シンプル、高速、軽量
- Vue.js: 学習コスト低、日本語ドキュメント充実

Q2: "データベースはどれを使用しますか？"
選択肢:
- PostgreSQL (推奨): リレーショナル、Supabase対応
- MongoDB: NoSQL、柔軟なスキーマ
- SQLite: ローカル開発、シンプル
```

### ドキュメント作成の原則
- **Claude Codeの役割**: 情報収集、要件整理、ドキュメント構成の決定
- **Geminiの役割**: 整理された情報をもとに、正式なドキュメントを生成
- **作成フロー**:
  1. Claude Codeが要件ヒアリング・情報整理
  2. Geminiがドキュメント生成（/gemini-docs）
  3. Codexがドキュメントレビュー（/codex-review）
  4. フィードバック反映後、確定

### ドキュメント種別と担当

| ドキュメント | 担当 | タイミング |
|-------------|------|-----------|
| 要件定義書（REQUIREMENTS.md） | Gemini | Phase 1完了時 |
| 設計書（DESIGN.md） | Gemini | Phase 2完了時 |
| README（README.md） | Gemini | Phase 5 |
| API仕様書（API.md） | Gemini | Phase 5 |
| ユーザーマニュアル（USER_MANUAL.md） | Gemini | Phase 5 |
| 開発者ドキュメント（DEVELOPMENT.md） | Gemini | Phase 5 |

---

## 開発フェーズとアジェンダ

### Phase 1: 要件定義
- [x] 機能要件の整理
- [x] 非機能要件の定義
- [x] ユーザーストーリーの作成
- [x] 要件定義書作成（doc/REQUIREMENTS.md v1.0.0）
- [x] **Codexレビュー**: 要件定義の妥当性確認
- [x] レビューフィードバック反映（doc/REQUIREMENTS.md v1.1.0）

### Phase 2: 設計
- [x] システムアーキテクチャ設計
- [x] データモデル詳細設計
- [x] UI/UX設計
- [x] API設計
- [x] 設計書作成（doc/DESIGN.md v1.0.0）
- [x] **Codexレビュー**: 設計の妥当性確認
- [x] レビューフィードバック反映（doc/DESIGN.md v1.1.0）

### Phase 3: 実装
- [x] 開発環境セットアップ
  - [x] プロジェクト構造作成
  - [x] バックエンド初期化（TypeScript, Express, better-sqlite3, Zod）
  - [x] フロントエンド初期化（Vite, React, TypeScript, Tailwind CSS）
  - [x] テスト環境構築（Jest, Vitest, Playwright）
  - [x] 基本ファイル作成（database.ts, app.ts, Entry models）
- [x] バックエンド実装（TDD）
  - [x] データベース層（Repository）
    - 52個のテストが全て成功
    - 100%テストカバレッジ達成
    - SQLインジェクション対策実装済み
  - [x] サービス層（Business Logic）
  - [x] コントローラー層（API Endpoints）
  - [x] バリデーション（Zod schemas）
    - 155個のテストが全て成功
    - 100%テストカバレッジ達成
    - 統合テスト実装済み
- [x] フロントエンド実装（TDD）
  - [x] API Service
  - [x] State Management（Context + Reducer）
  - [x] UIコンポーネント（EntryList, EntryForm, SearchBar）
  - [x] ページコンポーネント（EntryListPage, EntryCreatePage, EntryDetailPage, EntryEditPage）
    - 89個のテストが全て成功
    - 98.29%テストカバレッジ達成
    - 全5つの機能要件（FR-001～FR-005）実装済み
- [x] **Codexレビュー**: 実装品質確認
  - レビュー実施日: 2026-02-01
  - 指摘事項: 7件（High: 1件、Medium: 5件、Low: 2件）
  - 全ての指摘事項を修正完了
    1. APIレスポンス形状の修正（配列→単一オブジェクト）
    2. 削除APIをHTTP 204に変更
    3. エントリー並び順の自動ソート追加
    4. フロントエンドバリデーション強化
    5. parseId関数の厳密化
    6. SearchBarのvalue制御修正
- [x] 統合テスト・E2Eテスト
  - 25個のE2Eテストが全て成功
  - 成功率100%
  - 全5つの機能要件（FR-001～FR-005）をカバー
  - レスポンシブデザインテスト（デスクトップ、タブレット、モバイル）完了
  - ナビゲーションフロー、エラーハンドリングテスト完了

### Phase 4: テスト
- [x] ユニットテスト作成・実行
  - バックエンド: 155テスト、100%カバレッジ
  - フロントエンド: 89テスト、98.29%カバレッジ
  - ※Phase 3でTDDアプローチにより実施済み
- [x] 統合テスト作成・実行
  - バックエンド統合テスト完備
  - ※Phase 3で実施済み
- [x] E2Eテスト作成・実行
  - 25テスト、100%成功率
  - ※Phase 3で実施済み
- [x] **Codexレビュー**: テストカバレッジ・品質確認
  - Phase 3実装レビューで実施済み
  - 総テスト数269、全て成功

### Phase 5: ドキュメント作成
- [x] README作成
  - プロジェクト概要、セットアップ手順、使用方法を含む
  - GitHubリポジトリ用の本格的なREADME
- [x] API仕様書作成 (doc/API.md)
  - 全6エンドポイントの詳細仕様
  - サンプルコード、エラーハンドリング
- [x] ユーザーマニュアル作成 (doc/USER_MANUAL.md)
  - 基本操作、トラブルシューティング、FAQ
- [x] 開発者ドキュメント作成 (doc/DEVELOPMENT.md)
  - アーキテクチャ、開発ワークフロー、テスト戦略
- [ ] **Codexレビュー**: ドキュメント品質確認（※GitHubプッシュ後に実施）

### Phase 6: デプロイ・リリース
- [x] GitHubリポジトリ作成
  - リポジトリ: https://github.com/yn01/simple-diary
  - 初回コミット（d296405）プッシュ完了
  - 75ファイル、24,612行のコード
- [x] CI/CD設定
  - GitHub Actions CI ワークフロー作成（バックエンド/フロントエンド/E2Eテスト）
  - コード品質チェックワークフロー作成（Format/TypeScript）
  - Dependabot 自動依存関係更新設定
  - READMEにCIバッジ追加
- [x] デプロイ準備
  - デプロイガイド作成（doc/DEPLOYMENT.md）
  - Dockerデプロイ設定（Dockerfile, docker-compose.yml）
  - Render.com デプロイ手順書
  - VPS デプロイ手順書
  - READMEにデプロイセクション追加
- [ ] 本番デプロイ実行（オプション）
- [ ] リリースノート作成（オプション）

---

## 技術スタック

### フロントエンド
- Framework: React 18+ with Vite
- Language: TypeScript
- Styling: Tailwind CSS v3.4
- State Management: React Context + useReducer
- Routing: React Router DOM v6
- Validation: Zod v3.22

### バックエンド
- Runtime: Node.js
- Framework: Express
- Language: TypeScript
- API: REST API

### データベース
- Database: SQLite
- Library: better-sqlite3 v12.6.2

### デプロイ
- Environment: ローカル環境のみ
- Execution: npm scripts / Docker (TBD)

---

## 機能要件（仮）

### 基本機能
- [ ] 日記エントリーの作成
- [ ] 日記エントリーの閲覧
- [ ] 日記エントリーの編集
- [ ] 日記エントリーの削除
- [ ] 日記の検索
- [ ] カレンダービュー

### 拡張機能（オプション）
- [ ] タグ機能
- [ ] 画像添付
- [ ] マークダウン対応
- [ ] エクスポート機能
- [ ] ダークモード

---

## プロジェクト管理

### 現在のフェーズ

**Phase 3: 実装（完了）✅**

#### フェーズ3完了内容:

- **総テスト数**: 269テスト（100%成功）
  - バックエンド: 155テスト、100%カバレッジ
  - フロントエンド: 89テスト、98.29%カバレッジ
  - E2E: 25テスト、100%成功率
- **機能要件**: 全5機能要件（FR-001～FR-005）実装完了
- **コードレビュー**: Codexレビュー・指摘7件修正完了
- **セキュリティ**: SQLインジェクション、XSS対策完備
- **デザイン**: レスポンシブデザイン実装完了

**完了済みフェーズ:**
- ✅ Phase 1: 要件定義
- ✅ Phase 2: 設計
- ✅ Phase 3: 実装
- ✅ Phase 4: テスト
- ✅ Phase 5: ドキュメント作成

**現在のフェーズ**: Phase 6 デプロイ・リリース（GitHubプッシュ完了✅）
- リポジトリURL: https://github.com/yn01/simple-diary

### 次のアクション
1. （オプション）Codexによるドキュメントレビュー実施
2. （オプション）CI/CD設定（GitHub Actions）
3. （オプション）本番デプロイ環境構築

---

## Skills使用ガイド

### Codexレビューの実行
```bash
/codex-review
```
各フェーズ完了時にCodexによるレビューを実行

### Geminiドキュメント生成の実行
```bash
/gemini-docs
```
ドキュメント作成が必要な時にGeminiによるドキュメント生成を実行

---

## 更新履歴

- 2026-01-31: プロジェクト初期化、CLAUDE.md作成、Skillsファイル作成
- 2026-01-31: 要件定義完了、doc/REQUIREMENTS.md v1.0.0作成、技術スタック確定
- 2026-01-31: Codexレビュー実施、フィードバック反映、doc/REQUIREMENTS.md v1.1.0更新、Phase 1完了
- 2026-01-31: 設計完了、doc/DESIGN.md v1.0.0作成（Gemini使用）、Codexレビュー実施、フィードバック反映、doc/DESIGN.md v1.1.0更新、Phase 2完了
- 2026-02-01: Phase 3実装完了（バックエンド155テスト、フロントエンド89テスト、E2E 25テスト、全て成功）
- 2026-02-01: Codexレビュー実施（7件指摘）、全修正完了、Phase 4テスト完了
- 2026-02-01: Phase 5ドキュメント作成完了（README.md, API.md, USER_MANUAL.md, DEVELOPMENT.md）
- 2026-02-02: Phase 6デプロイ開始、GitHubリポジトリ作成・プッシュ完了（https://github.com/yn01/simple-diary）
- 2026-02-02: CI/CD設定完了（GitHub Actions CI/Code Quality、Dependabot）
- 2026-02-02: デプロイ準備完了（DEPLOYMENT.md、Docker設定、Render.com/VPS手順書）
- 2026-02-02: Phase 5ドキュメントレビュー実施（Codex、6件指摘：UI言語不一致、API仕様書誤記等）
