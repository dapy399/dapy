# ============================================================
# React Admin — 一键部署脚本（Windows PowerShell）
# 用法：右键 → 使用 PowerShell 运行，或命令行执行 .\deploy.ps1
# ============================================================

$ErrorActionPreference = "Stop"

# --- 服务器配置（根据你的截图填写）---
$ServerIP   = "47.86.62.38"
$ServerUser = "root"
$RemotePath = "/www/wwwroot/react-admin"
$LocalDist  = "$PSScriptRoot\dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  React Admin 一键部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- 检查 dist 目录 ---
if (-not (Test-Path $LocalDist)) {
    Write-Host "[错误] dist 目录不存在！先运行 npm run build" -ForegroundColor Red
    exit 1
}

# --- 检查 scp/ssh 是否可用 ---
try {
    $scp = Get-Command scp -ErrorAction Stop
    $ssh = Get-Command ssh -ErrorAction Stop
    Write-Host "[OK] 检测到 OpenSSH 工具" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未找到 scp/ssh 命令。请安装 OpenSSH 客户端：" -ForegroundColor Red
    Write-Host "       设置 → 应用 → 可选功能 → 添加功能 → OpenSSH 客户端" -ForegroundColor Yellow
    exit 1
}

# --- 提示输入密码（安全输入，不显示字符）---
Write-Host "服务器: $ServerIP"
Write-Host "用户名: $ServerUser"
Write-Host ""
$Password = Read-Host "请输入服务器 root 密码" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# --- 创建远程目录 ---
Write-Host ""
Write-Host "[1/4] 创建远程目录..." -ForegroundColor Cyan
$sshCmd = "echo '$PlainPassword' | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $ServerUser@$ServerIP `"mkdir -p $RemotePath && rm -rf $RemotePath/*`""
Invoke-Expression $sshCmd | Out-Null
Write-Host "[OK] 目录已清空" -ForegroundColor Green

# --- 上传 dist 文件 ---
Write-Host ""
Write-Host "[2/4] 上传 dist 文件到服务器（约 2.3MB）..." -ForegroundColor Cyan
$scpCmd = "echo '$PlainPassword' | scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -r `"$LocalDist\*`" $ServerUser@${ServerIP}:$RemotePath/"
Invoke-Expression $scpCmd
Write-Host "[OK] 文件上传完成" -ForegroundColor Green

# --- 配置宝塔站点（如果站点不存在则创建）---
Write-Host ""
Write-Host "[3/4] 配置宝塔面板站点..." -ForegroundColor Cyan

$nginxConf = @"
server {
    listen 80;
    server_name $ServerIP;
    index index.html;
    root $RemotePath;

    # SPA 路由回退
    location / {
        try_files \\$uri \\$uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control ""public, immutable"";
    }

    # 健康检查
    location = /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
"@

# 将配置写入临时文件再上传
$tempConf = "$env:TEMP\react-admin-nginx.conf"
$nginxConf | Out-File -FilePath $tempConf -Encoding UTF8

$scpConfCmd = "echo '$PlainPassword' | scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null `"$tempConf`" $ServerUser@${ServerIP}:/tmp/react-admin-nginx.conf"
Invoke-Expression $scpConfCmd

# 移动配置并重启 nginx
$setupCmd = @"
echo '$PlainPassword' | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $ServerUser@$ServerIP '
    # 复制 nginx 配置到宝塔目录
    cp /tmp/react-admin-nginx.conf /www/server/panel/vhost/nginx/react-admin.conf
    # 测试 nginx 配置
    nginx -t
    # 重载 nginx
    nginx -s reload
    echo "站点配置完成"
'
"@
Invoke-Expression $setupCmd
Write-Host "[OK] 站点配置完成" -ForegroundColor Green

# --- 检查部署结果 ---
Write-Host ""
Write-Host "[4/4] 检查部署结果..." -ForegroundColor Cyan
$checkCmd = "echo '$PlainPassword' | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $ServerUser@$ServerIP 'ls -la $RemotePath/'"
Invoke-Expression $checkCmd

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  http://$ServerIP" -ForegroundColor Yellow
Write-Host ""
Write-Host "宝塔面板（如需管理）：" -ForegroundColor Cyan
Write-Host "  http://${ServerIP}:8888" -ForegroundColor Yellow
Write-Host ""

# 清理安全字符串
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
