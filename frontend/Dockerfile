# React Frontend Dockerfile（本番用）

# ビルドステージ
FROM node:18-alpine as build

WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# 本番ステージ
FROM nginx:alpine

# ビルドされたファイルをNginxにコピー
COPY --from=build /app/build /usr/share/nginx/html

# Nginxの設定ファイルをコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート3000を公開
EXPOSE 3000

# Nginxを起動
CMD ["nginx", "-g", "daemon off;"]