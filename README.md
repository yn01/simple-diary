# Simple Diary

シンプルで使いやすいWebベースの日記アプリケーション

[![CI](https://github.com/yn01/simple-diary/actions/workflows/ci.yml/badge.svg)](https://github.com/yn01/simple-diary/actions/workflows/ci.yml)
[![Code Quality](https://github.com/yn01/simple-diary/actions/workflows/code-quality.yml/badge.svg)](https://github.com/yn01/simple-diary/actions/workflows/code-quality.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-99.4%25-brightgreen.svg)](https://github.com)
[![Tests](https://img.shields.io/badge/tests-269%20passing-success.svg)](https://github.com)

## 概要

Simple Diaryは、ローカル環境で動作するシンプルなWebベースの日記アプリケーションです。日付とプレーンテキストの本文で構成される日記エントリーを作成、閲覧、編集、削除、検索することができます。

### 主な特徴

- 📝 **シンプルな日記作成**: 日付と本文のみのシンプルなエントリー
- 🔍 **強力な検索機能**: キーワードによる全文検索
- 📱 **レスポンシブデザイン**: デスクトップ、タブレット、スマートフォンに対応
- 🔒 **セキュア**: SQLインジェクション・XSS対策済み
- ✅ **高品質**: 269テスト、99.4%カバレッジ達成
- 🚀 **高速**: ローカルSQLiteで高速動作

## 主要機能

| 機能 | 説明 | ステータス |
|------|------|----------|
| **エントリー作成** | 日付と本文を入力して日記を作成 | ✅ |
| **エントリー閲覧** | 時系列（降順）で日記を一覧表示 | ✅ |
| **エントリー編集** | 既存の日記を編集 | ✅ |
| **エントリー削除** | 日記を削除（確認ダイアログ付き） | ✅ |
| **エントリー検索** | キーワードで日記を検索 | ✅ |

## スクリーンショット

<!-- スクリーンショットは後で追加 -->
```
├── エントリー一覧ページ (/)
├── エントリー作成ページ (/entries/new)
├── エントリー詳細ページ (/entries/:id)
└── エントリー編集ページ (/entries/:id/edit)
```

## 技術スタック

### フロントエンド
- **React 18.2** - UIライブラリ
- **Vite 5.0** - ビルドツール
- **TypeScript 5.2** - 型安全性
- **Tailwind CSS 3.4** - スタイリング
- **React Router DOM 6.21** - ルーティング
- **Zod 3.22** - バリデーション

### バックエンド
- **Node.js 20+** - ランタイム
- **Express 4.18** - Webフレームワーク
- **TypeScript 5.3** - 型安全性
- **better-sqlite3 12.6** - SQLiteドライバ
- **Zod 3.22** - バリデーション

### テスト
- **Jest 29.7** - バックエンドテスト
- **Vitest 1.1** - フロントエンドテスト
- **Playwright 1.40** - E2Eテスト
- **Supertest 6.3** - API統合テスト

## 前提条件

- Node.js 20.x 以上
- npm 10.x 以上

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd simple-diary
```

### 2. 依存関係のインストール

#### バックエンド
```bash
cd backend
npm install
```

#### フロントエンド
```bash
cd frontend
npm install
```

### 3. 環境変数の設定

バックエンドの環境変数を設定します：

```bash
cd backend
cp .env.example .env
```

`.env`ファイル:
```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/diary.db
```

## 起動方法

### 開発モード

#### バックエンド
```bash
cd backend
npm run dev
```
→ http://localhost:3000 で起動

#### フロントエンド
```bash
cd frontend
npm run dev
```
→ http://localhost:5173 で起動

### 本番ビルド

#### バックエンド
```bash
cd backend
npm run build
npm start
```

#### フロントエンド
```bash
cd frontend
npm run build
npm run preview
```

## 使用方法

### 1. 日記を作成する
1. トップページ (http://localhost:5173) にアクセス
2. 「新規エントリー」ボタンをクリック
3. 日付と本文を入力
4. 「保存」ボタンをクリック

### 2. 日記を閲覧する
- トップページに日記エントリーが日付降順で表示されます
- エントリーをクリックすると詳細が表示されます

### 3. 日記を編集する
1. エントリー詳細ページで「編集」ボタンをクリック
2. 内容を変更して「保存」ボタンをクリック

### 4. 日記を削除する
1. エントリー詳細ページで「削除」ボタンをクリック
2. 確認ダイアログで「はい」を選択

### 5. 日記を検索する
1. トップページの検索バーにキーワードを入力
2. 検索結果が日付降順で表示されます

## プロジェクト構造

```
simple-diary/
├── backend/                 # バックエンド (Node.js + Express)
│   ├── src/
│   │   ├── controllers/     # コントローラー層
│   │   ├── services/        # サービス層
│   │   ├── repositories/    # リポジトリ層
│   │   ├── models/          # 型定義
│   │   ├── middlewares/     # ミドルウェア
│   │   ├── routes/          # ルーティング
│   │   ├── database.ts      # データベース初期化
│   │   └── app.ts           # Express アプリ
│   ├── tests/               # テスト
│   └── data/                # SQLiteデータベース
├── frontend/                # フロントエンド (React + Vite)
│   ├── src/
│   │   ├── components/      # UIコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── contexts/        # React Context
│   │   ├── services/        # APIクライアント
│   │   ├── types/           # 型定義
│   │   └── App.tsx          # ルートコンポーネント
│   └── tests/               # テスト
└── doc/                     # ドキュメント
    ├── REQUIREMENTS.md      # 要件定義書
    ├── DESIGN.md            # 設計書
    ├── API.md               # API仕様書
    └── USER_MANUAL.md       # ユーザーマニュアル
```

## テスト

### 全テスト実行

#### バックエンド
```bash
cd backend
npm test                    # テスト実行
npm run test:coverage       # カバレッジ付き
```

#### フロントエンド
```bash
cd frontend
npm test                    # テスト実行
npm run test:coverage       # カバレッジ付き
npm run e2e                 # E2Eテスト
```

**E2Eテスト実行の注意**:
- E2Eテストはバックエンドサーバーが必要です
- 事前に `cd backend && npm run dev` でバックエンドを起動してください
- Playwrightが自動的にフロントエンドサーバーを起動します（`playwright.config.ts` の `webServer` 設定）

### テスト結果

| カテゴリ | テスト数 | 成功率 | カバレッジ |
|---------|---------|-------|----------|
| バックエンドユニットテスト | 155 | 100% | 100% |
| フロントエンドユニットテスト | 89 | 100% | 98.29% |
| E2Eテスト | 25 | 100% | - |
| **合計** | **269** | **100%** | **99.4%** |

## 開発

### TDD (テスト駆動開発)

このプロジェクトはTDDアプローチで開発されています：

1. **RED**: テストを書く（失敗することを確認）
2. **GREEN**: テストをパスする最小限のコードを書く
3. **REFACTOR**: コードをリファクタリング

### コーディング規約

- **Linting**: ESLint
- **Formatting**: Prettier
- **型チェック**: TypeScript strict mode

```bash
# コード整形
npm run format

# Lint チェック
npm run lint
```

## API エンドポイント

| Method | Endpoint | 説明 |
|--------|----------|------|
| POST | /api/entries | エントリー作成 |
| GET | /api/entries | エントリー一覧取得 |
| GET | /api/entries/:id | エントリー詳細取得 |
| PUT | /api/entries/:id | エントリー更新 |
| DELETE | /api/entries/:id | エントリー削除 |
| GET | /api/entries/search?q={keyword} | エントリー検索 |

詳細は [API.md](doc/API.md) を参照してください。

## セキュリティ

- ✅ **SQLインジェクション対策**: プリペアドステートメント使用
- ✅ **XSS対策**: React標準のエスケープ + 入力バリデーション
- ✅ **入力バリデーション**: Zodによる厳密なバリデーション
- ✅ **エラーハンドリング**: グローバルエラーハンドラー実装

## パフォーマンス

- ⚡ データベースインデックス設定済み
- ⚡ 適切なHTTPステータスコード
- ⚡ ローカルSQLiteで高速動作

## デプロイ

### Dockerでのデプロイ

```bash
# ビルド＆起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down
```

### その他のデプロイ方法

- Render.com（推奨）
- VPS (DigitalOcean, Linode等)

詳細は [DEPLOYMENT.md](doc/DEPLOYMENT.md) を参照してください。

## 貢献

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。

## 開発チーム

- **開発手法**: TDD (テスト駆動開発) + マルチエージェント協調
- **品質管理**: Codexレビュー + 自動テスト
- **開発期間**: 2日間 (2026-01-31 ～ 2026-02-01)

## リンク

- [要件定義書](doc/REQUIREMENTS.md)
- [設計書](doc/DESIGN.md)
- [API仕様書](doc/API.md)
- [ユーザーマニュアル](doc/USER_MANUAL.md)
- [開発者ドキュメント](doc/DEVELOPMENT.md)
- [デプロイガイド](doc/DEPLOYMENT.md)

---

Made with ❤️ using TDD
