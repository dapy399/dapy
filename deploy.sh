#!/bin/bash
# ============================================================
# React Admin — 一键部署脚本（Bash）
# 用法：bash deploy.sh
# ============================================================

set -e

SERVER_IP="47.86.62.38"
SERVER_USER="root"
REMOTE_PATH="/www/wwwroot/react-admin"
LOCAL_DIST="./dist"

echo "========================================"
echo "  React Admin 一键部署脚本"
echo "========================================"
echo ""

# 检查 dist 目录
if [ ! -d "$LOCAL_DIST" ]; then
    echo "[错误] dist 目录不存在！先运行 npm run build"
    exit 1
fi

# 检查 ssh/scp
if ! command -v ssh &> /dev/null || ! command -v scp &> /dev/null; then
    echo "[错误] 未找到 ssh/scp 命令"
    exit 1
fi

# 输入密码（不显示）
echo "服务器: $SERVER_IP"
echo "用户名: $SERVER_USER"
read -s -p "请输入服务器 root 密码: " PASSWORD
echo ""

echo ""
echo "[1/4] 创建远程目录..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_PATH && rm -rf $REMOTE_PATH/*"
echo "[OK] 目录已清空"

echo ""
echo "[2/4] 上传 dist 文件..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -r "$LOCAL_DIST"/* "$SERVER_USER@$SERVER_IP:$REMOTE_PATH/"
echo "[OK] 文件上传完成"

echo ""
echo "[3/4] 配置 Nginx..."

# 创建 nginx 配置
NGINX_CONF=$(cat <<EOF
server {
    listen 80;
    server_name $SERVER_IP;
    index index.html;
    root $REMOTE_PATH;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF
)

# 上传配置并应用
echo "$NGINX_CONF" | sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" '
    cat > /tmp/react-admin-nginx.conf
    cp /tmp/react-admin-nginx.conf /www/server/panel/vhost/nginx/react-admin.conf
    nginx -t && nginx -s reload
    echo "[OK] Nginx 配置已重载"
'

echo ""
echo "[4/4] 检查部署结果..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "ls -la $REMOTE_PATH"

echo ""
echo "========================================"
echo "  部署成功！"
echo "========================================"
echo ""
echo "访问地址："
echo "  http://$SERVER_IP"
echo ""
echo "宝塔面板："
echo "  http://${SERVER_IP}:8888"
