# PhotoWatermark2 开发指南

## 🚀 如何重新开始开发

### 1. 环境准备

#### 系统要求
- Node.js 16+ 
- npm 或 yarn
- Git
- Windows 10/11 (推荐)

#### 开发工具推荐
- VS Code (推荐)
- Trae AI IDE (当前使用)

### 2. 项目启动步骤

#### 第一次启动
```bash
# 1. 克隆项目（如果是新环境）
git clone https://github.com/nuochen0107/photowatermark2.git
cd photowatermark2

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run start
```

#### 日常开发启动
```bash
# 1. 进入项目目录
cd d:\learn\homework\photowatermark2\photowatermark2

# 2. 检查Git状态
git status
git pull origin feat/import-panel

# 3. 启动开发服务器
npm run start
```

### 3. 项目结构说明

```
photowatermark2/
├── electron/                 # Electron主进程代码
│   └── main.js              # 主进程入口，处理图片处理逻辑
├── src/                     # React前端代码
│   ├── components/          # React组件
│   │   ├── ImageList.jsx    # 图片列表组件
│   │   ├── ImportPanel.jsx  # 导入面板组件
│   │   └── PreviewPanel.jsx # 预览面板组件
│   ├── store/               # 状态管理
│   │   └── imageStore.js    # 图片状态管理
│   ├── App.jsx              # 主应用组件
│   ├── App.css              # 主样式文件
│   └── main.jsx             # React入口
├── package.json             # 项目配置和依赖
├── vite.config.js           # Vite构建配置
├── PRD.md                   # 产品需求文档
├── PLAN.md                  # 项目实施计划
├── TODO.md                  # 待实现功能清单
└── DEVELOPMENT_GUIDE.md     # 本开发指南
```

### 4. 当前技术栈

#### 前端
- **React 18**: 用户界面框架
- **Vite**: 构建工具和开发服务器
- **Ant Design**: UI组件库
- **Zustand**: 状态管理（通过自定义store实现）

#### 后端/桌面
- **Electron**: 桌面应用框架
- **Sharp**: 图片处理库
- **Node.js**: 运行时环境

### 5. 开发工作流

#### 分支管理
- `main`: 主分支，稳定版本
- `feat/import-panel`: 当前开发分支（图片导入功能）
- 新功能建议创建新的feature分支

#### 提交规范
使用 Conventional Commits 规范：
```bash
# 新功能
git commit -m "feat: 添加水印编辑器基础功能"

# 修复bug
git commit -m "fix: 修复图片预览黑屏问题"

# 文档更新
git commit -m "docs: 更新开发指南"

# 样式调整
git commit -m "style: 优化预览面板布局"
```

### 6. 调试和测试

#### 开发调试
```bash
# 启动开发模式
npm run start

# 查看Electron开发者工具
# 在应用中按 Ctrl+Shift+I
```

#### 常见问题排查
1. **应用启动失败**
   - 检查Node.js版本
   - 重新安装依赖：`npm install`
   - 清除缓存：`npm run clean`（如果有）

2. **图片处理失败**
   - 检查Sharp库是否正确安装
   - 查看Electron主进程日志
   - 确认图片格式支持

3. **界面显示异常**
   - 检查React组件错误
   - 查看浏览器开发者工具
   - 确认CSS样式加载

### 7. 下一步开发重点

#### 立即开始的功能
1. **水印编辑器组件**
   - 创建 `WatermarkEditor.jsx`
   - 实现文本输入和预览
   - 添加透明度控制

2. **水印合成逻辑**
   - 在 `electron/main.js` 中添加水印合成功能
   - 使用Sharp进行图片和文本合成
   - 实现实时预览更新

#### 开发建议
- 先实现最小可用版本（MVP）
- 每个功能都要有错误处理
- 保持代码提交频率
- 及时更新文档

### 8. 有用的命令

```bash
# 开发相关
npm run start          # 启动开发服务器
npm run build          # 构建生产版本
npm run electron:dev   # 仅启动Electron

# Git相关
git status             # 查看文件状态
git add .              # 添加所有更改
git commit -m "msg"    # 提交更改
git push origin feat/import-panel  # 推送到远程

# 依赖管理
npm install            # 安装依赖
npm update             # 更新依赖
npm audit fix          # 修复安全漏洞
```

### 9. 联系和支持

- **项目仓库**: https://github.com/nuochen0107/photowatermark2
- **问题反馈**: 通过GitHub Issues
- **开发文档**: 查看项目根目录下的Markdown文件

---

## 📋 快速检查清单

开始开发前请确认：
- [ ] Node.js环境正常
- [ ] 项目依赖已安装
- [ ] Git状态干净
- [ ] 开发服务器能正常启动
- [ ] 已阅读TODO.md了解待实现功能
- [ ] 了解当前代码结构

**祝开发顺利！** 🎉

---
*创建日期：2024年9月29日*
*适用版本：v0.1.0+*