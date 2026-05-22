# ============================================================
# React Admin — Dockerfile（多阶段构建）
# 路径：C:\Users\MACHENIKE\Desktop\react-admin\Dockerfile
# ============================================================

# ============================================================
# 阶段一：构建（Build Stage）
# 使用 Node 镜像编译项目
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制 package 文件，利用 Docker 缓存层
COPY package*.json ./

# 安装依赖（NODE_ENV=production 不安装 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建生产包（注入环境变量）
ARG VITE_API_BASE_URL=https://api.example.com
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ============================================================
# 阶段二：运行（Runtime Stage）
# 使用 Nginx 镜像运行静态文件
# ============================================================
FROM nginx:alpine

# 复制构建产物到 nginx html 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置文件（覆盖默认配置）
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
