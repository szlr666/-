let currentQRCanvas = null;
let currentQRText = '';
let currentLogoImage = null;
let currentEmojiLogo = null;
const qrHistory = [];
const MAX_HISTORY = 6;

// 环境检测
const isProd = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
const isHttps = location.protocol === 'https:';

// 生产环境建议
if (isProd && !isHttps && window.location.hostname !== 'localhost') {
    console.warn('建议使用 HTTPS 协议访问以获得更好的安全性');
}

// DOM 元素
const textInput = document.getElementById('textInput');
const generateBtn = document.getElementById('generateBtn');
const qrcodeSection = document.getElementById('qrcodeSection');
const qrcodeContainer = document.getElementById('qrcodeContainer');
const qrSizeSelect = document.getElementById('qrSize');
const errorLevelSelect = document.getElementById('errorLevel');
const fgColorInput = document.getElementById('fgColor');
const fgColorText = document.getElementById('fgColorText');
const bgColorInput = document.getElementById('bgColor');
const bgColorText = document.getElementById('bgColorText');
const borderSizeInput = document.getElementById('borderSize');
const borderSizeValue = document.getElementById('borderSizeValue');
const borderRadiusInput = document.getElementById('borderRadius');
const borderRadiusValue = document.getElementById('borderRadiusValue');
const logoUpload = document.getElementById('logoUpload');
const logoPreview = document.getElementById('logoPreview');
const logoPreviewImg = document.getElementById('logoPreviewImg');
const removeLogo = document.getElementById('removeLogo');
const logoSizeInput = document.getElementById('logoSize');
const logoSizeValue = document.getElementById('logoSizeValue');
const downloadPngBtn = document.getElementById('downloadPng');
const downloadJpgBtn = document.getElementById('downloadJpg');
const downloadSvgBtn = document.getElementById('downloadSvg');
const downloadPdfBtn = document.getElementById('downloadPdf');
const historyContainer = document.getElementById('historyContainer');
const clearHistoryBtn = document.getElementById('clearHistory');

// 标签页切换
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
});

// 颜色选择器同步
fgColorInput.addEventListener('input', (e) => {
    fgColorText.value = e.target.value;
});

fgColorText.addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        fgColorInput.value = e.target.value;
    }
});

bgColorInput.addEventListener('input', (e) => {
    bgColorText.value = e.target.value;
});

bgColorText.addEventListener('input', (e) => {
    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
        bgColorInput.value = e.target.value;
    }
});

// 边框大小滑块
borderSizeInput.addEventListener('input', (e) => {
    borderSizeValue.textContent = e.target.value;
});

// 圆角半径滑块
borderRadiusInput.addEventListener('input', (e) => {
    borderRadiusValue.textContent = e.target.value + 'px';
});

// Logo大小滑块
logoSizeInput.addEventListener('input', (e) => {
    logoSizeValue.textContent = e.target.value + '%';
});

// 快速配色
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const fg = btn.dataset.fg;
        const bg = btn.dataset.bg;
        fgColorInput.value = fg;
        fgColorText.value = fg;
        bgColorInput.value = bg;
        bgColorText.value = bg;
    });
});

// Logo上传
logoUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                currentLogoImage = img;
                currentEmojiLogo = null;
                logoPreviewImg.src = event.target.result;
                logoPreview.style.display = 'block';
                document.querySelector('.upload-box').parentElement.style.display = 'none';
                // 清除emoji选中状态
                document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('selected'));
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 移除Logo
removeLogo.addEventListener('click', () => {
    currentLogoImage = null;
    currentEmojiLogo = null;
    logoPreview.style.display = 'none';
    document.querySelector('.upload-box').parentElement.style.display = 'block';
    logoUpload.value = '';
    document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('selected'));
});

// Emoji Logo选择
document.querySelectorAll('.logo-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentEmojiLogo = btn.dataset.emoji;
        currentLogoImage = null;
        logoPreview.style.display = 'none';
        document.querySelector('.upload-box').parentElement.style.display = 'block';
        logoUpload.value = '';
        
        // 更新选中状态
        document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

// 生成二维码
generateBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    if (!text) {
        showToast('请输入要生成二维码的内容！', 'warning');
        return;
    }

    const size = parseInt(qrSizeSelect.value);
    const errorLevel = errorLevelSelect.value;
    const fgColor = fgColorInput.value;
    const bgColor = bgColorInput.value;
    const borderSize = parseInt(borderSizeInput.value);
    const borderRadius = parseInt(borderRadiusInput.value);
    const logoSizePercent = parseInt(logoSizeInput.value) / 100;
    
    currentQRText = text;
    
    // 显示加载状态
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="loading"></span> 生成中...';
    
    // 清空之前的二维码
    qrcodeContainer.innerHTML = '';
    
    try {
        // 使用离线库生成二维码
        const eccMap = {
            'L': qrcodegen.Ecc.LOW,
            'M': qrcodegen.Ecc.MEDIUM,
            'Q': qrcodegen.Ecc.QUARTILE,
            'H': qrcodegen.Ecc.HIGH
        };
        const qr = qrcodegen.QrCode.encodeText(text, eccMap[errorLevel]);
        
        // 创建canvas
        const canvas = document.createElement('canvas');
        const scale = Math.floor(size / qr.size);
        canvas.width = (qr.size + borderSize * 2) * scale;
        canvas.height = (qr.size + borderSize * 2) * scale;
        
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制二维码
        ctx.fillStyle = fgColor;
        for (let y = 0; y < qr.size; y++) {
            for (let x = 0; x < qr.size; x++) {
                if (qr.getModule(x, y)) {
                    ctx.fillRect((x + borderSize) * scale, (y + borderSize) * scale, scale, scale);
                }
            }
        }
        
        // 绘制Logo或Emoji
        if (currentLogoImage || currentEmojiLogo) {
            const logoSize = Math.floor(qr.size * logoSizePercent) * scale;
            const logoX = (canvas.width - logoSize) / 2;
            const logoY = (canvas.height - logoSize) / 2;
            
            // 绘制白色背景和边框
            ctx.fillStyle = '#FFFFFF';
            const padding = scale * 2;
            ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2);
            
            if (currentLogoImage) {
                // 绘制图片Logo
                ctx.drawImage(currentLogoImage, logoX, logoY, logoSize, logoSize);
            } else if (currentEmojiLogo) {
                // 绘制Emoji Logo
                ctx.font = `${logoSize * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(currentEmojiLogo, canvas.width / 2, canvas.height / 2);
            }
        }
        
        qrcodeContainer.appendChild(canvas);
        currentQRCanvas = canvas;
        
        // 应用圆角（确保生效）
        if (borderRadius > 0) {
            canvas.style.borderRadius = borderRadius + 'px';
            canvas.style.overflow = 'hidden';
        } else {
            canvas.style.borderRadius = '0';
        }
        
        // 添加到历史记录
        addToHistory(canvas, text);
        saveHistoryToStorage();
        
        // 恢复按钮状态
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🎨 生成精美二维码';
        
        qrcodeSection.style.display = 'block';
        
        // 优化滚动：确保移动端和PC端都能看到结果
        setTimeout(() => {
            qrcodeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        
        // 添加成功动画
        qrcodeContainer.classList.add('success-flash');
        setTimeout(() => qrcodeContainer.classList.remove('success-flash'), 500);
        
        showToast('二维码生成成功！', 'success');
    } catch (err) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '🎨 生成精美二维码';
        showToast('生成二维码失败：' + err.message, 'error');
        console.error(err);
    }
});

// 生成友好的文件名
function generateFileName(ext) {
    // 获取文本内容的前15个字符作为文件名
    let prefix = 'qrcode';
    if (currentQRText) {
        // 清理文本，只保留字母数字中文
        const cleanText = currentQRText.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 15);
        if (cleanText) {
            prefix = cleanText;
        }
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${prefix}_${timestamp}.${ext}`;
}

// 下载为 PNG
downloadPngBtn.addEventListener('click', () => {
    if (!currentQRCanvas) {
        showToast('请先生成二维码！', 'warning');
        return;
    }

    const dataUrl = currentQRCanvas.toDataURL('image/png');
    const filename = generateFileName('png');
    downloadFile(dataUrl, filename);
});

// 下载为 SVG
downloadSvgBtn.addEventListener('click', () => {
    if (!currentQRCanvas) {
        showToast('请先生成二维码！', 'warning');
        return;
    }

    const dataUrl = currentQRCanvas.toDataURL('image/png');
    const filename = generateFileName('svg.png');
    downloadFile(dataUrl, filename);
});

// 下载为 JPG
downloadJpgBtn.addEventListener('click', () => {
    if (!currentQRCanvas) {
        showToast('请先生成二维码！', 'warning');
        return;
    }

    // 创建临时 canvas 添加白色背景
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = currentQRCanvas.width;
    tempCanvas.height = currentQRCanvas.height;

    // 填充白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 绘制二维码
    ctx.drawImage(currentQRCanvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
    const filename = generateFileName('jpg');
    downloadFile(dataUrl, filename);
});

// 下载为 PDF
downloadPdfBtn.addEventListener('click', () => {
    if (!currentQRCanvas) {
        showToast('请先生成二维码！', 'warning');
        return;
    }

    // 创建一个新的canvas，以A4纸张比例创建
    const pdfCanvas = document.createElement('canvas');
    const pdfWidth = 2480;  // A4 宽度 (300 DPI)
    const pdfHeight = 3508; // A4 高度 (300 DPI)
    pdfCanvas.width = pdfWidth;
    pdfCanvas.height = pdfHeight;
    
    const ctx = pdfCanvas.getContext('2d');
    
    // 白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pdfWidth, pdfHeight);
    
    // 计算二维码居中位置
    const qrSize = 1500; // 二维码大小
    const x = (pdfWidth - qrSize) / 2;
    const y = (pdfHeight - qrSize) / 2;
    
    // 绘制二维码
    ctx.drawImage(currentQRCanvas, x, y, qrSize, qrSize);
    
    // 添加文字说明
    if (currentQRText && currentQRText.length <= 100) {
        ctx.fillStyle = '#333333';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentQRText.substring(0, 50), pdfWidth / 2, y + qrSize + 100);
        if (currentQRText.length > 50) {
            ctx.fillText(currentQRText.substring(50, 100), pdfWidth / 2, y + qrSize + 150);
        }
    }
    
    // 转换为图片并下载 (作为PDF替代方案，生成高分辨率PNG)
    const dataUrl = pdfCanvas.toDataURL('image/png');
    const filename = generateFileName('a4.png');
    downloadFile(dataUrl, filename);
});

// 历史记录管理
function addToHistory(canvas, text) {
    // 创建更高分辨率的缩略图（提高清晰度）
    const thumbnail = document.createElement('canvas');
    const size = 240; // 提高到240以获得更清晰的显示
    thumbnail.width = size;
    thumbnail.height = size;
    const ctx = thumbnail.getContext('2d');
    
    // 使用高质量的图像缩放
    ctx.imageSmoothingEnabled = false; // 禁用平滑以保持二维码锐利
    
    // 直接绘制二维码（保留原始颜色）
    ctx.drawImage(canvas, 0, 0, size, size);
    
    // 调试信息
    console.log('添加到历史:', {
        canvasSize: `${canvas.width}x${canvas.height}`,
        thumbnailSize: `${thumbnail.width}x${thumbnail.height}`,
        text: text.substring(0, 20)
    });
    
    // 添加到历史数组
    const historyItem = {
        canvas: thumbnail,
        text: text,
        timestamp: Date.now()
    };
    
    qrHistory.unshift(historyItem);
    if (qrHistory.length > MAX_HISTORY) {
        qrHistory.pop();
    }
    
    renderHistory();
}

function renderHistory() {
    historyContainer.innerHTML = '';
    
    if (qrHistory.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">暂无历史记录</p>';
        return;
    }
    
    qrHistory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.title = item.text.substring(0, 50);
        
        // 确保canvas正确显示
        const canvas = item.canvas;
        canvas.style.display = 'block';
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        div.appendChild(canvas);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'history-item-delete';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            qrHistory.splice(index, 1);
            renderHistory();
            saveHistoryToStorage();
        };
        div.appendChild(deleteBtn);
        
        div.onclick = () => {
            qrcodeContainer.innerHTML = '';
            
            // 创建新的完整尺寸canvas
            const fullCanvas = document.createElement('canvas');
            const targetSize = parseInt(qrSizeSelect.value);
            fullCanvas.width = targetSize;
            fullCanvas.height = targetSize;
            const ctx = fullCanvas.getContext('2d');
            
            // 直接绘制二维码（保留原始颜色）
            ctx.drawImage(item.canvas, 0, 0, targetSize, targetSize);
            
            qrcodeContainer.appendChild(fullCanvas);
            currentQRCanvas = fullCanvas;
            currentQRText = item.text;
            
            // 添加成功动画
            qrcodeContainer.classList.add('success-flash');
            setTimeout(() => qrcodeContainer.classList.remove('success-flash'), 500);
            
            // 显示二维码区域
            qrcodeSection.style.display = 'block';
            
            // 优化滚动：确保移动端和PC端都能看到结果
            setTimeout(() => {
                qrcodeSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        };
        
        historyContainer.appendChild(div);
    });
}

// 清空历史
clearHistoryBtn.addEventListener('click', () => {
    if (confirm('确定要清空所有历史记录吗？')) {
        qrHistory.length = 0;
        renderHistory();
        saveHistoryToStorage();
        showToast('历史记录已清空', 'success');
    }
});

// Toast提示函数
function showToast(message, type = 'info') {
    // 移除旧的toast
    const oldToast = document.querySelector('.toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span style="margin-right: 8px;">${icons[type] || icons.info}</span>${message}`;
    
    document.body.appendChild(toast);
    
    // 触发动画
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 3秒后移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化文本输入，实时预览字数
const charCounter = document.createElement('div');
charCounter.style.cssText = 'text-align: right; font-size: 12px; color: #999; margin-top: 5px;';
textInput.parentNode.insertBefore(charCounter, textInput.nextSibling);

textInput.addEventListener('input', debounce(() => {
    const length = textInput.value.length;
    charCounter.textContent = `已输入 ${length} 个字符`;
    if (length > 1000) {
        charCounter.style.color = '#dc2626';
        charCounter.textContent = `⚠️ 已输入 ${length} 个字符（超出建议长度，可能无法扫描）`;
    } else if (length > 500) {
        charCounter.style.color = '#ef4444';
        charCounter.textContent = `⚠️ 已输入 ${length} 个字符（内容较长可能影响扫描）`;
    } else if (length > 200) {
        charCounter.style.color = '#f59e0b';
        charCounter.textContent = `已输入 ${length} 个字符`;
    } else {
        charCounter.style.color = '#999';
    }
}, 300));

// 页面加载完成提示
window.addEventListener('load', () => {
    // 检查浏览器兼容性
    if (!window.HTMLCanvasElement) {
        showToast('您的浏览器不支持 Canvas，部分功能可能无法使用', 'error');
        return;
    }
    
    // 加载历史记录（从 localStorage）
    loadHistoryFromStorage();
    
    setTimeout(() => {
        showToast('欢迎使用专业二维码生成器！', 'success');
    }, 500);
    
    // 生产环境统计（可选）
    if (isProd) {
        console.log('QR Code Generator v1.0 - Ready');
    }
});

// 生成友好的文件名
function generateFileName(ext) {
    // 获取文本内容的前15个字符作为文件名
    let prefix = 'qrcode';
    if (currentQRText) {
        // 清理文本，只保留字母数字中文
        const cleanText = currentQRText.replace(/[^\w\u4e00-\u9fa5]/g, '_').substring(0, 15);
        if (cleanText) {
            prefix = cleanText;
        }
    }
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `${prefix}_${timestamp}.${ext}`;
}

// 通用下载函数
function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 显示下载成功提示，并说明保存位置
    showToast(`✅ 文件已保存：${filename}\n📁 位置：下载文件夹`, 'success');
}

// 回车键生成二维码（支持 Ctrl+Enter 或 Cmd+Enter）
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // 阻止默认换行行为
        generateBtn.click();
    }
});

// 支持粘贴功能（确保没有被阻止）
textInput.addEventListener('paste', (e) => {
    // 不阻止默认行为，只是显示提示
    setTimeout(() => {
        const length = textInput.value.length;
        if (length > 0) {
            showToast(`已粘贴 ${length} 个字符`, 'info');
        }
    }, 10);
});

// 历史记录持久化
function saveHistoryToStorage() {
    try {
        const historyData = qrHistory.map(item => ({
            text: item.text,
            timestamp: item.timestamp,
            dataUrl: item.canvas.toDataURL('image/png')
        }));
        localStorage.setItem('qrHistory', JSON.stringify(historyData));
    } catch (e) {
        console.warn('保存历史记录失败:', e);
    }
}

function loadHistoryFromStorage() {
    try {
        const stored = localStorage.getItem('qrHistory');
        if (!stored) return;
        
        const historyData = JSON.parse(stored);
        historyData.forEach(item => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 240;  // 与新的缩略图尺寸一致
                canvas.height = 240;
                const ctx = canvas.getContext('2d');
                
                // 禁用平滑以保持清晰
                ctx.imageSmoothingEnabled = false;
                
                // 直接绘制图片（保留原始颜色）
                ctx.drawImage(img, 0, 0, 240, 240);
                
                qrHistory.push({
                    canvas: canvas,
                    text: item.text,
                    timestamp: item.timestamp
                });
                
                if (qrHistory.length >= historyData.length) {
                    renderHistory();
                }
            };
            img.src = item.dataUrl;
        });
    } catch (e) {
        console.warn('加载历史记录失败:', e);
    }
}

// 性能监控（生产环境）
if (isProd && window.performance) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log('页面加载时间:', pageLoadTime + 'ms');
        }, 0);
    });
}
