# ============================================================
# React Admin — Dockerfile（多阶段构建）
# 项目路径：C:\Users\MACHENIKE\Desktop\react-admin
# 更新日期：2026-05-27（version pin + 健康检查 + 构建阶段修复）
# ============================================================

# ============================================================
# 阶段一：构建（Build Stage）
# Node 22-alpine — 与项目 package.json engine 对齐
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制 package 文件，利用 Docker 缓存层
COPY package.json package-lock.json ./

# 安装全部依赖（含 devDependencies，构建需要 tsc + vite）
# 注意：alpine 镜像默认未设置 NODE_ENV，npm ci 会装全部依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建时注入环境变量
ARG VITE_API_BASE_URL=https://api.example.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 类型检查 + 构建
RUN npm run build

# ============================================================
# 阶段二：运行（Runtime Stage）
# Nginx 1.27-alpine — fixed version, 含 curl 用于健康检查
# ============================================================
FROM nginx:1.27-alpine

# 安装 curl 用于容器健康检查探测
RUN apk add --no-cache curl

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 nginx 主配置（覆盖镜像默认配置）
COPY nginx.conf /etc/nginx/nginx.conf

# 健康检查：复用 nginx.conf 中已有的 /health 端点
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
