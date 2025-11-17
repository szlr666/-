# 二维码生成器 - 部署指南

## 📦 项目文件说明

### 核心文件（必须）
- `index.html` - 主页面
- `style.css` - 样式文件
- `app.js` - 应用逻辑
- `qrcodegen.js` - 二维码生成库

### 配置文件（可选）
- `.htaccess` - Apache 服务器配置
- `nginx.conf` - Nginx 服务器配置
- `deploy.sh` - 自动部署脚本

---

## 🚀 快速部署

### 方法一：静态文件托管（最简单）

适用于：GitHub Pages、Vercel、Netlify 等

1. 上传所有核心文件到平台
2. 直接访问即可使用
3. 无需任何配置

**推荐平台：**
- GitHub Pages（免费）
- Vercel（免费，自动 HTTPS）
- Netlify（免费，CDN 加速）

---

### 方法二：Apache 服务器

1. 上传所有文件到服务器目录
```bash
scp -r * user@server:/var/www/qrcode/
```

2. 确保 `.htaccess` 文件已上传

3. 重启 Apache
```bash
sudo systemctl reload apache2
```

4. 访问 `http://your-domain.com`

---

### 方法三：Nginx 服务器

1. 上传所有核心文件
```bash
scp index.html style.css app.js qrcodegen.js user@server:/var/www/qrcode/
```

2. 配置 Nginx（参考 nginx.conf）
```bash
sudo nano /etc/nginx/sites-available/qrcode
```

3. 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/qrcode /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 方法四：使用自动部署脚本

1. 编辑 `deploy.sh` 配置
```bash
REMOTE_HOST="your-server.com"
REMOTE_USER="root"
REMOTE_PATH="/var/www/qrcode"
```

2. 执行部署
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ⚙️ 配置优化

### 1. HTTPS 配置（强烈推荐）

**使用 Let's Encrypt 免费证书：**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 2. CDN 加速（可选）

推荐使用：
- Cloudflare（免费）
- 阿里云 CDN
- 腾讯云 CDN

### 3. 缓存策略

已在配置文件中设置：
- HTML：不缓存
- CSS/JS：缓存 7 天
- 图片：缓存 30 天

---

## 🔧 高级配置

### 自定义域名

1. 添加 DNS 解析
```
A 记录: @ -> 服务器IP
A 记录: www -> 服务器IP
```

2. 等待 DNS 生效（最多 24 小时）

### 启用 Gzip 压缩

已在配置文件中启用，可减少 70% 传输大小

### 安全头配置

已配置以下安全头：
- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Referrer-Policy

---

## 📊 性能优化

### 已优化项
✅ Gzip 压缩
✅ 浏览器缓存
✅ 资源本地化（无外部依赖）
✅ 响应式设计
✅ 懒加载动画
✅ 防抖优化

### 进一步优化（可选）
- 启用 HTTP/2
- 配置 CDN
- 使用 WebP 图片格式
- 开启 Brotli 压缩

---

## 🐛 故障排查

### 页面无法访问
1. 检查文件权限：`chmod -R 755 /var/www/qrcode`
2. 检查服务器状态：`systemctl status nginx` 或 `apache2`
3. 查看错误日志

### 功能异常
1. 打开浏览器控制台查看错误
2. 确认浏览器支持 Canvas
3. 清除浏览器缓存

### HTTPS 证书问题
```bash
# 更新证书
sudo certbot renew

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 📱 移动端优化

已完成：
- 响应式布局
- 触摸优化
- 移动端适配
- PWA 支持（可选）

---

## 🔄 更新部署

1. 修改本地文件
2. 上传到服务器
3. 清除浏览器缓存测试

**使用 rsync 增量更新：**
```bash
rsync -avz --delete ./ user@server:/var/www/qrcode/
```

---

## 💾 备份建议

定期备份：
```bash
# 备份网站文件
tar -czf qrcode-backup-$(date +%Y%m%d).tar.gz /var/www/qrcode

# 备份到远程
scp qrcode-backup-*.tar.gz backup@backup-server:/backups/
```

---

## 📞 技术支持

如有问题：
1. 检查浏览器控制台
2. 查看服务器日志
3. 确认配置文件正确

---

## 📄 许可证

本项目完全开源免费，可商用。

---

**部署成功后，建议测试以下功能：**
- [x] 文本输入和二维码生成
- [x] 颜色自定义
- [x] Logo 上传
- [x] 文件下载
- [x] 历史记录
- [x] 移动端适配
- [x] 各浏览器兼容性

祝部署顺利！🎉
