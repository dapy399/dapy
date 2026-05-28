#!/bin/bash
# ============================================================
# React Admin — 阿里云 ECS 首次部署环境准备脚本
# 适用系统：CentOS 7+ / Ubuntu 20.04+
# 执行方式：scp setup-server.sh root@你的公网IP:/tmp/ && ssh root@你的公网IP "bash /tmp/setup-server.sh"
# ============================================================

set -e

echo "============================================"
echo "  React Admin — ECS 服务器初始化"
echo "============================================"

# -------------------- 1. 检测系统 --------------------
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo ">>> 检测到系统：$OS"
else
    echo ">>> 未知系统，假定为 CentOS"
    OS="centos"
fi

# -------------------- 2. 安装 Docker --------------------
if command -v docker &> /dev/null; then
    echo ">>> Docker 已安装：$(docker --version)"
else
    echo ">>> 正在安装 Docker..."

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        sudo apt-get update -y
        sudo apt-get install -y ca-certificates curl gnupg lsb-release
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$OS/gpg | \
            sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
          https://download.docker.com/linux/$OS $(lsb_release -cs) stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update -y
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    else
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo \
            https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
    fi
    echo ">>> Docker 安装完成"
fi

# -------------------- 3. 启动 Docker + 开机自启 --------------------
echo ">>> 启动 Docker 并设置开机自启..."
sudo systemctl enable docker --now
sudo systemctl status docker --no-pager | head -5

# -------------------- 4. 当前用户加入 docker 组 --------------------
CURRENT_USER=$(whoami)
if groups "$CURRENT_USER" | grep -q docker; then
    echo ">>> 用户 $CURRENT_USER 已在 docker 组中"
else
    echo ">>> 将 $CURRENT_USER 加入 docker 组..."
    sudo usermod -aG docker "$CURRENT_USER"
    echo ">>> 注意：重新登录后生效，或执行 newgrp docker"
fi

# -------------------- 5. 创建项目目录 --------------------
REMOTE_DIR="/opt/react-admin"
echo ">>> 创建项目目录：$REMOTE_DIR"
sudo mkdir -p "$REMOTE_DIR"
sudo chown -R "$CURRENT_USER:$CURRENT_USER" "$REMOTE_DIR"

# -------------------- 6. 安全组提示 --------------------
echo ""
echo "============================================"
echo "  ECS 安全组配置提醒"
echo "============================================"
echo "  登录阿里云控制台 → ECS → 安全组 → 添加规则："
echo "    端口 80 (HTTP)   来源 0.0.0.0/0"
echo "    端口 22 (SSH)    来源 0.0.0.0/0（如已开放可忽略）"
echo ""
echo "============================================"
echo "  初始化完成！"
echo "============================================"
echo "  项目目录：$REMOTE_DIR"
echo "  Docker 版本：$(docker --version)"
echo ""
echo "  下一步：在 GitHub 仓库配置 5 个 Secrets"
echo "    ECS_HOST          = ECS 公网 IP (121.43.149.193)"
echo "    ECS_PORT          = 22"
echo "    ECS_USER          = root"
echo "    ECS_KEY           = SSH 私钥全文（~/.ssh/id_ed25519 的内容）"
echo "    VITE_API_BASE_URL  = 后端 API 地址"
echo "============================================"
