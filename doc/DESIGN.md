# Simple Diary アプリケーション設計書

## 1. ドキュメント情報

| 項目         | 内容                                                                     |
| :----------- | :----------------------------------------------------------------------- |
| プロジェクト名 | Simple Diary                                                             |
| 概要         | 日々の記録を簡単に行えるシンプルな日記アプリケーション               |
| 技術スタック   | フロントエンド: React + Vite (TypeScript), バックエンド: Node.js + Express (TypeScript), データベース: SQLite |
| 要件定義書   | [doc/REQUIREMENTS.md](doc/REQUIREMENTS.md) v1.1.0                      |
| 作成日       | 2026-01-31                                                               |
| バージョン     | 1.1.0                                                                    |

## 2. システムアーキテクチャ

### 2.1. 全体アーキテクチャ

本アプリケーションは、フロントエンド（React）とバックエンド（Node.js + Express）がAPIを通じて連携するSPA（Single Page Application）構成とする。データベースにはSQLiteを使用し、バックエンドがデータ永続化を担当する。

```
+----------------+       +-------------------+       +-------------------+       +-----------------+
|    User Agent  | <---> |    Frontend (React) | <---> |  Backend (Node.js) | <---> |  Database (SQLite)  |
| (Web Browser)  |       |                   |       |      (Express)    |       |                 |
+----------------+       +-------------------+       +-------------------+       +-----------------+
```

### 2.2. バックエンド構成（3層アーキテクチャ）

バックエンドは、責務を明確にするために以下の3層アーキテクチャを採用する。

1.  **Controller層**:
    *   HTTPリクエストの受付とレスポンスの返却。
    *   リクエストデータのバリデーション（Zodを使用）。
    *   Service層への処理委譲。
    *   エラーハンドリングと適切なHTTPステータスコードの返却。

2.  **Service層**:
    *   ビジネスロジックの実装。
    *   複数のRepositoryを組み合わせたデータ操作。
    *   トランザクション管理（必要に応じて）。

3.  **Repository層**:
    *   データベースへの直接的なデータアクセス。
    *   特定のエンティティに対するCRUD操作を提供。
    *   データベースライブラリ（better-sqlite3）の抽象化。

### 2.3. ディレクトリ構成

```
.
├── frontend/
│   ├── src/
│   │   ├── components/  # 再利用可能なUIコンポーネント
│   │   ├── pages/       # 各画面のルートコンポーネント
│   │   ├── services/    # バックエンドAPIとの通信ロジック
│   │   ├── types/       # TypeScriptの型定義
│   │   ├── hooks/       # カスタムHooks
│   │   ├── contexts/    # React Contextによる状態管理
│   │   └── App.tsx
│   └── public/
├── backend/
│   ├── src/
│   │   ├── controllers/ # Controller層の実装
│   │   ├── services/    # Service層の実装
│   │   ├── repositories/ # Repository層の実装
│   │   ├── models/      # データベースのエンティティ定義
│   │   ├── middlewares/ # Expressミドルウェア
│   │   ├── routes/      # ルーティング定義
│   │   ├── utils/       # ユーティリティ関数
│   │   └── app.ts
│   ├── tests/
│   └── package.json
└── doc/
    ├── REQUIREMENTS.md
    └── DESIGN.md (本ファイル)
```

## 3. データモデル詳細設計

### 3.1. Entryテーブル定義（DDL）

```sql
CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,  -- YYYY-MM-DD形式
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,  -- ISO 8601形式
  updated_at TEXT NOT NULL   -- ISO 8601形式
);

-- インデックス
CREATE INDEX idx_entries_date ON entries(date DESC);
```

### 3.2. データ制約

*   `id`: 自動採番される主キー。
*   `date`: 日記の日付。`YYYY-MM-DD` 形式の文字列で格納する。1日に複数件の日記エントリを登録可能であるため、一意制約は設けない。
*   `content`: 日記の内容。1文字以上の文字列を必須とし、空文字列は許可しない。
*   `created_at`: エントリが作成された日時。ISO 8601形式 (`YYYY-MM-DDTHH:mm:ss.sssZ`) の文字列で格納する。
*   `updated_at`: エントリが最後に更新された日時。ISO 8601形式 (`YYYY-MM-DDTHH:mm:ss.sssZ`) の文字列で格納する。

## 4. API設計

### 4.1. TypeScript型定義

#### Request Body / Response Data Types

```typescript
// エントリの基本型
interface Entry {
  id: number;
  date: string; // YYYY-MM-DD
  content: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// 新規エントリ作成リクエスト
interface CreateEntryRequest {
  date: string; // YYYY-MM-DD
  content: string;
}

// エントリ更新リクエスト
interface UpdateEntryRequest {
  content: string;
}

// 検索結果
interface SearchEntriesResponse {
  entries: Entry[];
}

// エラーレスポンス
interface ErrorResponse {
  message: string;
  details?: string[];
}
```

### 4.2. エンドポイント一覧

#### 4.2.1. エントリ新規作成

*   **HTTP Method**: `POST`
*   **Path**: `/api/entries`
*   **Description**: 新しい日記エントリを作成する。
*   **Request Body**: `CreateEntryRequest`
    ```json
    {
      "date": "2026-01-31",
      "content": "今日の出来事..."
    }
    ```
*   **Response**: `Entry` (HTTP 201 Created)
    ```json
    {
      "id": 1,
      "date": "2026-01-31",
      "content": "今日の出来事...",
      "created_at": "2026-01-31T12:00:00.000Z",
      "updated_at": "2026-01-31T12:00:00.000Z"
    }
    ```
*   **Error Response**: `ErrorResponse` (HTTP 400 Bad Request, 500 Internal Server Error)
    ```json
    {
      "message": "Validation Error",
      "details": ["'content' must not be empty."]
    }
    ```

#### 4.2.2. エントリ一覧取得

*   **HTTP Method**: `GET`
*   **Path**: `/api/entries`
*   **Description**: 全ての日記エントリを時系列降順（新しいものが先）で取得する。
*   **Request Query**: なし
*   **Response**: `Entry[]` (HTTP 200 OK)
    ```json
    [
      {
        "id": 2,
        "date": "2026-02-01",
        "content": "明日の出来事...",
        "created_at": "2026-02-01T12:00:00.000Z",
        "updated_at": "2026-02-01T12:00:00.000Z"
      },
      {
        "id": 1,
        "date": "2026-01-31",
        "content": "今日の出来事...",
        "created_at": "2026-01-31T12:00:00.000Z",
        "updated_at": "2026-01-31T12:00:00.000Z"
      }
    ]
    ```
*   **Error Response**: `ErrorResponse` (HTTP 500 Internal Server Error)

#### 4.2.3. エントリ詳細取得

*   **HTTP Method**: `GET`
*   **Path**: `/api/entries/:id`
*   **Description**: 指定されたIDの日記エントリを取得する。
*   **Path Parameters**: `id` (number) - エントリのID
*   **Response**: `Entry` (HTTP 200 OK)
    ```json
    {
      "id": 1,
      "date": "2026-01-31",
      "content": "今日の出来事...",
      "created_at": "2026-01-31T12:00:00.000Z",
      "updated_at": "2026-01-31T12:00:00.000Z"
    }
    ```
*   **Error Response**: `ErrorResponse` (HTTP 404 Not Found, 500 Internal Server Error)
    ```json
    {
      "message": "Entry not found"
    }
    ```

#### 4.2.4. エントリ更新

*   **HTTP Method**: `PUT`
*   **Path**: `/api/entries/:id`
*   **Description**: 指定されたIDの日記エントリを更新する。
*   **Path Parameters**: `id` (number) - エントリのID
*   **Request Body**: `UpdateEntryRequest`
    ```json
    {
      "content": "更新された今日の出来事！"
    }
    ```
*   **Response**: `Entry` (HTTP 200 OK)
    ```json
    {
      "id": 1,
      "date": "2026-01-31",
      "content": "更新された今日の出来事！",
      "created_at": "2026-01-31T12:00:00.000Z",
      "updated_at": "2026-01-31T12:30:00.000Z"
    }
    ```
*   **Error Response**: `ErrorResponse` (HTTP 400 Bad Request, 404 Not Found, 500 Internal Server Error)

#### 4.2.5. エントリ削除

*   **HTTP Method**: `DELETE`
*   **Path**: `/api/entries/:id`
*   **Description**: 指定されたIDの日記エントリを削除する。
*   **Path Parameters**: `id` (number) - エントリのID
*   **Response**: なし (HTTP 204 No Content)
*   **Error Response**: `ErrorResponse` (HTTP 404 Not Found, 500 Internal Server Error)

#### 4.2.6. エントリ検索

*   **HTTP Method**: `GET`
*   **Path**: `/api/entries/search`
*   **Description**: 日記エントリの内容（`content`）に対してキーワード検索を行う。部分一致（LIKE検索）をサポートする。
*   **Request Query**: `q` (string) - 検索キーワード
    *   例: `/api/entries/search?q=出来事`
*   **Response**: `SearchEntriesResponse` (HTTP 200 OK)
    ```json
    {
      "entries": [
        {
          "id": 1,
          "date": "2026-01-31",
          "content": "今日の出来事...",
          "created_at": "2026-01-31T12:00:00.000Z",
          "updated_at": "2026-01-31T12:00:00.000Z"
        }
      ]
    }
    ```
*   **Error Response**: `ErrorResponse` (HTTP 400 Bad Request, 500 Internal Server Error)
    ```json
    {
      "message": "Validation Error",
      "details": ["'q' parameter is required for search."]
    }
    ```

## 5. UI/UX設計

### 5.1. 画面構成

以下の3つの主要な画面で構成される。

1.  **エントリーリスト画面（メイン）**
    *   全ての日記エントリを時系列降順で一覧表示する。
    *   各エントリの簡易表示（日付、内容の冒頭など）。
    *   エントリの新規作成ボタン。
    *   エントリ検索フォーム。
    *   各エントリへの詳細・編集・削除アクションへのリンク。

2.  **エントリー作成/編集画面**
    *   日記エントリの新規作成および既存エントリの編集を行うフォーム。
    *   日付入力フィールド。
    *   内容入力用のテキストエリア。
    *   保存ボタン、キャンセルボタン。

3.  **エントリー詳細画面**
    *   選択された日記エントリの全内容を表示する。
    *   日付、内容、作成日時、更新日時を表示。
    *   編集ボタン、削除ボタン、リストに戻るボタン。

### 5.2. 画面遷移

*   `/` (エントリーリスト)
    *   `→ /new` (エントリー作成)
    *   `→ /:id` (エントリー詳細)
    *   `→ /:id/edit` (エントリー編集)

### 5.3. レスポンシブ対応

Tailwind CSS を使用して、以下のブレイクポイントでレスポンシブデザインを実装する。

*   **モバイル (`max-width: 640px`)**:
    *   コンテンツは1カラムで表示。
    *   要素は画面幅いっぱいに広がる。
*   **タブレット (`641px` 〜 `1024px`)**:
    *   コンテンツは1カラムで表示。
    *   左右に適切なサイドマージンを設けて視認性を向上させる。
*   **デスクトップ (`1025px` 〜)**:
    *   コンテンツは中央に配置し、最大幅を`800px`に設定して視認性と読みやすさを確保する。

## 6. 技術選定

| カテゴリ           | 技術名             | 選定理由                                                                                                               |
| :----------------- | :----------------- | :--------------------------------------------------------------------------------------------------------------------- |
| フロントエンドフレームワーク | React + Vite     | 高い開発効率と豊富なエコシステム。Viteによる高速な開発サーバーとビルド。                                                 |
| バックエンドフレームワーク   | Node.js + Express  | JavaScript/TypeScriptでフルスタック開発が可能。軽量で柔軟なWebアプリケーション構築に適している。                      |
| データベース       | SQLite             | シンプルな構成で、本アプリケーションのような小規模な用途に適している。別途データベースサーバーの構築が不要。             |
| データベースアクセスライブラリ | better-sqlite3     | Node.jsからSQLiteを高速かつ同期的に操作できる。シンプルで使いやすいAPI。                                               |
| バリデーション     | Zod                | TypeScriptフレンドリーなスキーマ定義と強力なバリデーション機能。実行時と開発時の型安全性を保証。                     |
| 状態管理           | React Context      | 小規模アプリケーションでの状態管理に適しており、外部ライブラリの追加なしにReact標準機能で実現できる。                  |
| スタイリング       | Tailwind CSS       | ユーティリティファーストのアプローチで、高速なUI開発が可能。レスポンシブデザインの実装が容易。                         |

## 7. セキュリティ設計

*   **入力バリデーション**: すべてのAPIエンドポイントでZodを用いた厳格な入力バリデーションを行い、不正なデータや悪意のある入力（例: SQLインジェクション、XSS）を排除する。
*   **エラーハンドリング**: サーバー側で発生したエラーは詳細をクライアントに返さず、一般的なエラーメッセージを返すことで情報漏洩を防ぐ。ログには詳細なエラー情報を記録する。
*   **依存関係の管理**: `npm audit` などを利用して、定期的に依存ライブラリの脆弱性をチェックし、最新のセキュリティパッチを適用する。
*   **CORS (Cross-Origin Resource Sharing)**: フロントエンドとバックエンドが異なるオリジンで動作する場合、Expressミドルウェアで適切なCORSポリシーを設定する。
*   **環境変数の利用**: データベース接続情報などの機密情報は、コードに直接書き込まず、環境変数で管理する。
*   **認証・認可**: 現時点ではユーザー認証・認可は含まないが、将来的に機能追加する際には、JWT (JSON Web Tokens) やセッション管理を導入し、セキュアな認証フローを実装する。

## 8. 非機能要件への対応

*   **パフォーマンス**:
    *   データベースのインデックス（`idx_entries_date`）を適切に活用し、データ検索・取得の高速化を図る。
    *   フロントエンドでは、Reactのコンポーネント最適化（`React.memo`, `useCallback` など）を考慮し、不要な再レンダリングを抑制する。
*   **スケーラビリティ**:
    *   SQLiteは小規模アプリケーションには適しているが、将来的にデータ量が増加したり、複数ユーザーでの同時アクセスが必要になった場合は、PostgreSQLなどのRDBMSへの移行を検討する。
    *   Node.jsのクラスタリングやロードバランサーの導入により、バックエンドのスケーリングを可能にする。
*   **可用性**:
    *   単一障害点（SPOF）を避ける設計は現時点では行わない。
    *   将来的にコンテナ化（Docker）し、オーケストレーションツール（Kubernetes）と組み合わせることで可用性を向上させる。
*   **保守性**:
    *   3層アーキテクチャと明確なディレクトリ構成により、コードの変更箇所を特定しやすく、保守性を高める。
    *   TypeScriptによる型安全性の確保。
    *   Prettier, ESLintによるコードフォーマットと静的解析。
*   **テスト容易性**:
    *   各層（Controller, Service, Repository）で単体テストを記述し、機能変更時のデグレードを防ぐ。
    *   統合テストやE2Eテストの導入も検討する。
*   **エラーハンドリング**:
    *   グローバルなエラーハンドリングミドルウェアをExpressに導入し、未捕捉のエラーを適切に処理・ログ記録する。
    *   フロントエンドでは、APIエラーをユーザーに分かりやすく表示し、必要に応じてリトライなどのUXを提供する。

## 9. 開発環境構成

*   **OS**: macOS / Linux / Windows
*   **Node.js**: v18.x 以降 (LTS版を推奨)
*   **npm / Yarn**: パッケージマネージャ
*   **Git**: バージョン管理システム
*   **IDE**: Visual Studio Code (推奨)
    *   拡張機能: ESLint, Prettier, TypeScript Vue Plugin (Volar) など
*   **データベースクライアント**: SQLiteブラウザ, DataGripなど（開発・デバッグ用）

## 10. 変更履歴

| バージョン | 日付         | 変更内容         |
| :--------- | :----------- | :--------------- |
| 1.0.0      | 2026-01-31   | 初版作成         |
| 1.1.0      | 2026-01-31   | Codexレビュー指摘事項を反映。TypeScript明記、日付編集可能、APIレスポンス形式統一、検索結果並び順明記、XSS対策記述修正 |
