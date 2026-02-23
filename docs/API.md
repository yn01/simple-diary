# Simple Diary API仕様書

**バージョン**: 1.0.0
**ベースURL**: `http://localhost:3000`
**最終更新日**: 2026-02-01

## 概要

Simple Diary APIは、日記エントリーのCRUD操作と検索機能を提供するRESTful APIです。

## 認証

現在、APIには認証は実装されていません（ローカル環境での単一ユーザー利用を想定）。

## エンドポイント一覧

| Method | Endpoint | 説明 |
|--------|----------|------|
| GET | `/health` | ヘルスチェック |
| POST | `/api/entries` | エントリー作成 |
| GET | `/api/entries` | エントリー一覧取得 |
| GET | `/api/entries/:id` | エントリー詳細取得 |
| PUT | `/api/entries/:id` | エントリー更新 |
| DELETE | `/api/entries/:id` | エントリー削除 |
| GET | `/api/entries/search` | エントリー検索 |

---

## 1. ヘルスチェック

サーバーの稼働確認を行います。

### エンドポイント
```
GET /health
```

### レスポンス

#### 成功 (200 OK)
```json
{
  "status": "ok"
}
```

---

## 2. エントリー作成

新しい日記エントリーを作成します。

### エンドポイント
```
POST /api/entries
```

### リクエスト

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "date": "2026-01-31",
  "content": "今日の出来事を書きます。"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| date | string | ✅ | 日付 (YYYY-MM-DD形式) |
| content | string | ✅ | 本文 (空白のみは不可) |

### レスポンス

#### 成功 (201 Created)
```json
{
  "id": 1,
  "date": "2026-01-31",
  "content": "今日の出来事を書きます。",
  "created_at": "2026-01-31T12:00:00.000Z",
  "updated_at": "2026-01-31T12:00:00.000Z"
}
```

#### エラー (400 Bad Request)
```json
{
  "message": "Validation Error",
  "details": [
    "Content must not be empty"
  ]
}
```

### サンプルコード

#### cURL
```bash
curl -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-31",
    "content": "今日の出来事を書きます。"
  }'
```

#### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/entries', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    date: '2026-01-31',
    content: '今日の出来事を書きます。',
  }),
});
const entry = await response.json();
```

---

## 3. エントリー一覧取得

全ての日記エントリーを日付降順で取得します。

### エンドポイント
```
GET /api/entries
```

### リクエスト

パラメータなし

### レスポンス

#### 成功 (200 OK)
```json
[
  {
    "id": 2,
    "date": "2026-02-01",
    "content": "2月の最初の日記です。",
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": 1,
    "date": "2026-01-31",
    "content": "今日の出来事を書きます。",
    "created_at": "2026-01-31T12:00:00.000Z",
    "updated_at": "2026-01-31T12:00:00.000Z"
  }
]
```

**注**: 日付降順でソートされています。

### サンプルコード

#### cURL
```bash
curl http://localhost:3000/api/entries
```

#### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/entries');
const entries = await response.json();
```

---

## 4. エントリー詳細取得

指定されたIDの日記エントリーを取得します。

### エンドポイント
```
GET /api/entries/:id
```

### パス パラメータ

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | number | エントリーID |

### レスポンス

#### 成功 (200 OK)
```json
{
  "id": 1,
  "date": "2026-01-31",
  "content": "今日の出来事を書きます。",
  "created_at": "2026-01-31T12:00:00.000Z",
  "updated_at": "2026-01-31T12:00:00.000Z"
}
```

#### エラー (404 Not Found)
```json
{
  "message": "Entry not found"
}
```

#### エラー (400 Bad Request)
```json
{
  "message": "Invalid ID format"
}
```

### サンプルコード

#### cURL
```bash
curl http://localhost:3000/api/entries/1
```

#### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/entries/1');
const entry = await response.json();
```

---

## 5. エントリー更新

指定されたIDの日記エントリーを更新します。

### エンドポイント
```
PUT /api/entries/:id
```

### パス パラメータ

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | number | エントリーID |

### リクエスト

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "date": "2026-01-31",
  "content": "更新された内容です。"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| date | string | ✅ | 日付 (YYYY-MM-DD形式) |
| content | string | ✅ | 本文 (空白のみは不可) |

### レスポンス

#### 成功 (200 OK)
```json
{
  "id": 1,
  "date": "2026-01-31",
  "content": "更新された内容です。",
  "created_at": "2026-01-31T12:00:00.000Z",
  "updated_at": "2026-01-31T13:00:00.000Z"
}
```

**注**: `updated_at`が自動的に更新されます。

#### エラー (404 Not Found)
```json
{
  "message": "Entry not found"
}
```

#### エラー (400 Bad Request)
```json
{
  "message": "Validation Error",
  "details": [
    "Content must not be empty"
  ]
}
```

### サンプルコード

#### cURL
```bash
curl -X PUT http://localhost:3000/api/entries/1 \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-31",
    "content": "更新された内容です。"
  }'
```

#### JavaScript (fetch)
```javascript
const response = await fetch('http://localhost:3000/api/entries/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    date: '2026-01-31',
    content: '更新された内容です。',
  }),
});
const entry = await response.json();
```

---

## 6. エントリー削除

指定されたIDの日記エントリーを削除します。

### エンドポイント
```
DELETE /api/entries/:id
```

### パス パラメータ

| パラメータ | 型 | 説明 |
|-----------|---|------|
| id | number | エントリーID |

### レスポンス

#### 成功 (204 No Content)

レスポンスボディなし

#### エラー (404 Not Found)
```json
{
  "message": "Entry not found"
}
```

#### エラー (400 Bad Request)
```json
{
  "message": "Invalid ID format"
}
```

### サンプルコード

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/entries/1
```

#### JavaScript (fetch)
```javascript
await fetch('http://localhost:3000/api/entries/1', {
  method: 'DELETE',
});
```

---

## 7. エントリー検索

キーワードで日記エントリーを検索します（LIKE検索）。

### エンドポイント
```
GET /api/entries/search
```

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|---|-----|------|
| q | string | ✅ | 検索キーワード |

### レスポンス

#### 成功 (200 OK)
```json
[
  {
    "id": 3,
    "date": "2026-02-01",
    "content": "今日は旅行に行きました。",
    "created_at": "2026-02-01T10:00:00.000Z",
    "updated_at": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": 1,
    "date": "2026-01-31",
    "content": "旅行の準備をしました。",
    "created_at": "2026-01-31T12:00:00.000Z",
    "updated_at": "2026-01-31T12:00:00.000Z"
  }
]
```

**注**:
- 検索結果は日付降順でソートされます
- 部分一致検索です（例: "旅行" で "旅行に行く" もヒット）

#### エラー (400 Bad Request)
```json
{
  "message": "Validation Error",
  "details": [
    "'q' parameter is required for search."
  ]
}
```

### サンプルコード

#### cURL
```bash
curl "http://localhost:3000/api/entries/search?q=旅行"
```

#### JavaScript (fetch)
```javascript
const keyword = '旅行';
const response = await fetch(
  `http://localhost:3000/api/entries/search?q=${encodeURIComponent(keyword)}`
);
const results = await response.json();
```

---

## データモデル

### Entry

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | number | エントリーID（自動採番） |
| date | string | 日付 (YYYY-MM-DD形式) |
| content | string | 本文 |
| created_at | string | 作成日時 (ISO 8601形式) |
| updated_at | string | 更新日時 (ISO 8601形式) |

### バリデーションルール

#### date
- 必須フィールド
- YYYY-MM-DD形式
- 実在する日付であること（例: 2026-02-30は無効）

#### content
- 必須フィールド
- 空文字不可
- 空白のみ不可

---

## エラーレスポンス

### エラーフォーマット

```json
{
  "message": "エラーメッセージ",
  "details": [
    "詳細1",
    "詳細2"
  ]
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 (GET, PUT) |
| 201 | 作成成功 (POST) |
| 204 | 削除成功 (DELETE) |
| 400 | リクエスト不正 (バリデーションエラー) |
| 404 | リソースが見つからない |
| 500 | サーバーエラー |

---

## レート制限

現在、レート制限は実装されていません。

## CORS

開発環境では、全てのオリジンからのリクエストを許可しています。

---

## セキュリティ

### SQLインジェクション対策
- ✅ プリペアドステートメントを使用
- ✅ パラメータ化クエリ

### XSS対策
- ✅ 入力バリデーション
- ✅ 特殊文字のエスケープ

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2026-02-01 | 初版リリース |

---

**お問い合わせ**: [GitHub Issues](https://github.com)
