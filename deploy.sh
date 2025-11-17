#!/bin/bash

# 二维码生成器部署脚本
# 使用方法: ./deploy.sh

echo "======================================"
echo "   二维码生成器 - 自动部署脚本"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置变量（请根据实际情况修改）
REMOTE_HOST="your-server.com"
REMOTE_USER="root"
REMOTE_PATH="/var/www/qrcode"
LOCAL_PATH="."

# 检查必要文件
echo -e "${YELLOW}[1/5] 检查必要文件...${NC}"
required_files=("index.html" "style.css" "app.js" "qrcodegen.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}错误: 缺少必要文件 $file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ 所有必要文件存在${NC}"
echo ""

# 检测服务器类型
echo -e "${YELLOW}[2/5] 选择部署方式...${NC}"
echo "请选择您的服务器类型:"
echo "1) Nginx"
echo "2) Apache"
echo "3) 仅上传文件（手动配置）"
read -p "请输入选项 (1-3): " server_type

# 上传文件
echo ""
echo -e "${YELLOW}[3/5] 上传文件到服务器...${NC}"
echo "目标服务器: $REMOTE_USER@$REMOTE_HOST"
echo "目标路径: $REMOTE_PATH"
read -p "确认上传? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${RED}部署已取消${NC}"
    exit 0
fi

# 创建远程目录
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH"

# 上传文件
rsync -avz --progress \
    --include='*.html' \
    --include='*.css' \
    --include='*.js' \
    --include='.htaccess' \
    --exclude='*.sh' \
    --exclude='*.conf' \
    --exclude='*.md' \
    --exclude='*.txt' \
    --exclude='.git*' \
    $LOCAL_PATH/ $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

echo -e "${GREEN}✓ 文件上传完成${NC}"

# 配置服务器
echo ""
echo -e "${YELLOW}[4/5] 配置服务器...${NC}"

if [ "$server_type" == "1" ]; then
    echo "配置 Nginx..."
    scp nginx.conf $REMOTE_USER@$REMOTE_HOST:/etc/nginx/sites-available/qrcode
    ssh $REMOTE_USER@$REMOTE_HOST "ln -sf /etc/nginx/sites-available/qrcode /etc/nginx/sites-enabled/qrcode && nginx -t && systemctl reload nginx"
    echo -e "${GREEN}✓ Nginx 配置完成${NC}"
    
elif [ "$server_type" == "2" ]; then
    echo "Apache 配置文件已上传 (.htaccess)"
    ssh $REMOTE_USER@$REMOTE_HOST "systemctl reload apache2"
    echo -e "${GREEN}✓ Apache 配置完成${NC}"
else
    echo -e "${YELLOW}请手动配置您的服务器${NC}"
fi

# 设置权限
echo ""
echo -e "${YELLOW}[5/5] 设置文件权限...${NC}"
ssh $REMOTE_USER@$REMOTE_HOST "chown -R www-data:www-data $REMOTE_PATH && chmod -R 755 $REMOTE_PATH"
echo -e "${GREEN}✓ 权限设置完成${NC}"

# 完成
echo ""
echo -e "${GREEN}======================================"
echo "   部署完成！"
echo "======================================${NC}"
echo ""
echo "访问地址: http://$REMOTE_HOST"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "1. 如需 HTTPS，请配置 SSL 证书"
echo "2. 建议设置 CDN 加速"
echo "3. 定期检查服务器日志"
echo ""
