# Simple Diary デプロイガイド

**バージョン**: 1.0.0
**最終更新日**: 2026-02-02

## 目次

1. [概要](#概要)
2. [デプロイオプション](#デプロイオプション)
3. [Render.comデプロイ（推奨）](#rendercomデプロイ推奨)
4. [Dockerデプロイ](#dockerデプロイ)
5. [VPSデプロイ](#vpsデプロイ)
6. [環境変数](#環境変数)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Simple Diaryは以下の構成でデプロイ可能です：

- **フロントエンド**: React + Vite (静的ビルド)
- **バックエンド**: Node.js + Express
- **データベース**: SQLite（ファイルベース）

## デプロイオプション

### オプション1: Render.com（推奨）

**メリット**:
- 無料プランあり
- SQLiteサポート
- 自動デプロイ（GitHub連携）
- HTTPS対応

**デメリット**:
- 無料プランでは一定時間アクセスがないとスリープ
- **重要**: 無料プランでは永続ディスクが提供されないため、再デプロイやスリープ復帰時にSQLiteデータベースが初期化される可能性があります
  - 本番データを保存する場合は、有料プランで永続ディスクを追加するか、PostgreSQLなどの外部データベースへの移行を検討してください

### オプション2: Docker

**メリット**:
- ポータブル
- 再現性が高い
- ローカル/VPSどちらでも実行可能

**デメリット**:
- Docker知識が必要

### オプション3: VPS (DigitalOcean, Linode等)

**メリット**:
- フルコントロール
- 永続的なデータ保存

**デメリット**:
- サーバー管理が必要
- コスト（月額$5〜）

---

## Render.comデプロイ（推奨）

### 1. 準備

1. [Render.com](https://render.com)でアカウント作成
2. GitHubアカウントと連携

### 2. バックエンドデプロイ

1. Renderダッシュボードで「New +」→「Web Service」を選択
2. GitHubリポジトリ `yn01/simple-diary` を接続
3. 以下の設定を入力：

   - **Name**: `simple-diary-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. 環境変数を追加：
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_PATH=./data/diary.db
   ```

5. 「Create Web Service」をクリック

6. デプロイ完了後、URLをメモ（例: `https://simple-diary-backend.onrender.com`）

### 3. フロントエンドデプロイ

1. Renderダッシュボードで「New +」→「Static Site」を選択
2. 同じGitHubリポジトリを選択
3. 以下の設定を入力：

   - **Name**: `simple-diary-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. 環境変数を追加：
   ```
   VITE_API_BASE_URL=https://simple-diary-backend.onrender.com
   ```

5. 「Create Static Site」をクリック

### 4. フロントエンドAPI設定の更新（オプション）

> **注意**: 現在の実装では`VITE_API_BASE_URL`を使用していません。本番環境では以下のいずれかが必要です：
> - Nginxでリバースプロキシを設定し、フロントエンドとバックエンドを同じドメインで提供
> - `frontend/src/services/api.ts` を手動で更新して環境変数を使用

手動更新する場合の例：

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
```

### 5. バックエンドCORS設定の更新（オプション）

> **注意**: 現在の実装ではすべてのオリジンを許可しています。本番環境では以下の修正を推奨します。

`backend/src/app.ts` を手動で更新：

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

環境変数 `FRONTEND_URL` を追加：
```
FRONTEND_URL=https://simple-diary-frontend.onrender.com
```

---

## Dockerデプロイ

### 1. Dockerfileの作成（バックエンド）

`backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Dockerfileの作成（フロントエンド）

`frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

`frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. docker-compose.ymlの作成

プロジェクトルート:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_PATH=/app/data/diary.db
    volumes:
      - diary-data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  diary-data:
```

### 4. デプロイ実行

```bash
# ビルド＆起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 停止
docker-compose down

# データ永続化ボリューム削除（注意！）
docker-compose down -v
```

---

## VPSデプロイ

### 1. VPSセットアップ

```bash
# システム更新
sudo apt update && sudo apt upgrade -y

# Node.js 20.x インストール
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2インストール（プロセスマネージャー）
sudo npm install -g pm2

# Nginxインストール
sudo apt install -y nginx
```

### 2. アプリケーションデプロイ

```bash
# リポジトリクローン
cd /var/www
sudo git clone https://github.com/yn01/simple-diary.git
cd simple-diary

# バックエンドセットアップ
cd backend
sudo npm ci --only=production
sudo npm run build

# 環境変数設定
sudo cp .env.example .env
sudo nano .env  # 本番環境に合わせて編集

# PM2でバックエンド起動
pm2 start dist/app.js --name simple-diary-backend
pm2 save
pm2 startup

# フロントエンドビルド
cd ../frontend
sudo npm ci
sudo npm run build

# Nginxに静的ファイル配置
sudo cp -r dist/* /var/www/html/
```

### 3. Nginx設定

`/etc/nginx/sites-available/simple-diary`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

有効化：

```bash
sudo ln -s /etc/nginx/sites-available/simple-diary /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL証明書（Let's Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 環境変数

### バックエンド

| 変数名 | 説明 | デフォルト | 必須 |
|--------|------|-----------|------|
| `NODE_ENV` | 実行環境 | `development` | ✅ |
| `PORT` | サーバーポート | `3000` | ✅ |
| `DATABASE_PATH` | SQLiteファイルパス | `./data/diary.db` | ✅ |
| `FRONTEND_URL` | フロントエンドURL（CORS用） | `*` | ❌ |

### フロントエンド

| 変数名 | 説明 | デフォルト | 必須 |
|--------|------|-----------|------|
| `VITE_API_BASE_URL` | バックエンドAPIベースURL | `/api` | ❌ |

---

## トラブルシューティング

### データベースが作成されない

```bash
# データディレクトリ作成
mkdir -p backend/data
chmod 755 backend/data
```

### フロントエンドがAPIに接続できない

1. CORS設定を確認
2. API URLが正しいか確認
3. ブラウザDevToolsのネットワークタブでエラー確認

### Render.comでスリープから復帰しない

- 有料プラン（$7/月）にアップグレード
- または、定期的にpingするcronジョブを設定

### PM2プロセスが起動しない

```bash
# ログ確認
pm2 logs simple-diary-backend

# プロセス再起動
pm2 restart simple-diary-backend

# プロセス削除して再起動
pm2 delete simple-diary-backend
pm2 start dist/app.js --name simple-diary-backend
```

---

## セキュリティ考慮事項

### 本番環境での推奨事項

1. **環境変数の保護**: `.env` ファイルをGitにコミットしない
2. **HTTPS使用**: 必ずSSL/TLS証明書を設定
3. **CORS制限**: `FRONTEND_URL` を正確に設定
4. **レート制限**: Express用のrate-limiterミドルウェア追加を検討
5. **認証追加**: 将来的にはユーザー認証機能の追加を推奨

---

## バックアップ

### SQLiteデータベースのバックアップ

```bash
# 手動バックアップ
cp backend/data/diary.db backend/data/diary.db.backup-$(date +%Y%m%d)

# 定期バックアップ（cron）
0 2 * * * cp /path/to/backend/data/diary.db /path/to/backups/diary.db.backup-$(date +\%Y\%m\%d)
```

---

## 更新手順

### Dockerの場合

```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### VPSの場合

```bash
cd /var/www/simple-diary
git pull origin main

# バックエンド更新
cd backend
npm ci --only=production
npm run build
pm2 restart simple-diary-backend

# フロントエンド更新
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/html/
```

---

**デプロイ成功を祈ります！** 🚀

問題が発生した場合は、[GitHub Issues](https://github.com/yn01/simple-diary/issues)で報告してください。
