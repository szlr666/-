# 🎨 专业二维码生成器

一个功能强大、界面精美的在线二维码生成工具，支持自定义颜色、Logo嵌入、多格式下载等功能。

[![在线演示](https://img.shields.io/badge/demo-online-brightgreen)](http://localhost:8080)
[![开源协议](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ 核心特性

### 🎨 外观定制
- ✅ 自定义前景色和背景色
- ✅ 6 种预设配色方案
- ✅ 可调节边框大小（0-20）
- ✅ 可调节圆角半径（0-50px）

### 🖼️ Logo 嵌入
- ✅ 上传自定义图片（PNG/JPG/SVG）
- ✅ 8 个快速 Emoji 图标
- ✅ Logo 大小可调（10%-30%）
- ✅ 实时预览效果

### 📐 尺寸选项
- 小 (256px)
- 中 (512px)
- 大 (1024px)
- 超大 (2048px)

### 🛡️ 纠错级别
- L (7%) - 低
- M (15%) - 中
- Q (25%) - 高
- H (30%) - 最高

### 💾 下载格式
- PNG - 高质量透明背景
- JPG - 压缩格式
- SVG - 矢量格式（提示）
- PDF - A4 打印格式

### 🕒 历史记录
- 自动保存最近 6 个二维码
- 缩略图网格显示
- 点击快速恢复
- 本地持久化存储

---

## 📱 完美适配

- ✅ 桌面端（响应式）
- ✅ 平板端（≤768px）
- ✅ 手机端（≤600px）
- ✅ 小屏手机（≤375px）
- ✅ 横屏模式优化

---

## 🚀 快速开始

### 本地运行
```bash
# 克隆项目
git clone https://github.com/your-repo/qrcode-generator.git

# 进入目录
cd qrcode-generator

# 启动本地服务器（任选其一）
python -m http.server 8080
# 或
npx serve
```

访问 `http://localhost:8080`

### 直接部署
上传所有文件到任何静态托管服务即可：
- GitHub Pages
- Vercel
- Netlify
- 自己的服务器

详见 [DEPLOY.md](DEPLOY.md)

---

## 📦 项目结构

```
qrcode-generator/
├── index.html          # 主页面
├── style.css           # 样式文件
├── app.js              # 应用逻辑
├── qrcodegen.js        # 二维码库（离线）
├── .htaccess           # Apache 配置
├── nginx.conf          # Nginx 配置
├── deploy.sh           # 部署脚本
└── DEPLOY.md           # 部署指南
```

---

## 🛠️ 技术栈

- **前端框架**: 原生 JavaScript（无依赖）
- **二维码库**: qrcodegen.js（离线）
- **样式**: 纯 CSS3（渐变、动画）
- **存储**: localStorage（历史记录）
- **兼容性**: 现代浏览器

---

## 🎯 使用场景

### 企业应用
- 企业名片二维码
- 产品溯源码
- 活动签到码
- 公众号推广码

### 个人使用
- 个人网站/博客
- 社交媒体分享
- WiFi 密码分享
- 联系方式分享

### 开发集成
- 营销活动页面
- 电商产品页
- 移动应用推广
- 数据采集系统

---

## 💡 使用技巧

1. **高纠错级别** - Logo 较大时建议使用 H 级别
2. **颜色对比** - 确保前景色和背景色有足够对比度
3. **内容长度** - 内容越长，二维码越复杂，建议 ≤500 字符
4. **Logo 尺寸** - 建议 15%-25% 之间，过大可能影响扫描

---

## 📊 性能优化

- ✅ Gzip 压缩（减少 70% 传输）
- ✅ 浏览器缓存（CSS/JS 缓存 7 天）
- ✅ 懒加载动画
- ✅ 防抖优化
- ✅ 离线可用（无外部依赖）

---

## 🔒 隐私安全

- ✅ 完全本地生成，不上传任何数据
- ✅ 无后端服务器
- ✅ 无用户追踪
- ✅ 开源透明

---

## 🌐 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | ≥ 90 |
| Firefox | ≥ 88 |
| Safari | ≥ 14 |
| Edge | ≥ 90 |
| 移动浏览器 | 现代版本 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

MIT License - 完全免费，可商用

---

## 🙏 致谢

- 二维码算法：[qrcodegen](https://github.com/nayuki/QR-Code-generator)
- 图标来源：Emoji

---

## 📞 联系方式

- 🌐 网站：[your-website.com](https://your-website.com)
- 📧 邮箱：your-email@example.com
- 💬 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)

---

**⭐ 如果这个项目对您有帮助，请给个 Star！**

---

最后更新：2025-11-11
