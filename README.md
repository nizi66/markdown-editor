# Markdown Editor

一个功能强大的本地 Markdown 编辑器，支持实时预览、笔记管理、文件夹层级展示和本地文件同步。

## 主要功能

- **实时预览**：编辑时即时查看渲染效果
- **代码高亮**：支持多种编程语言语法高亮
- **笔记管理**：创建、删除、搜索笔记
- **文件夹层级**：支持文件夹分类管理笔记
- **目录导航**：自动生成文章大纲
- **图片上传**：支持本地图片上传
- **PDF导出**：一键导出为 PDF 文件
- **文件同步**：打开本地文件后可直接保存同步
- **快捷键支持**：Ctrl+S 保存，Ctrl+N 新建笔记

## 技术栈

- React 18 + TypeScript
- Tailwind CSS
- Zustand（状态管理）
- marked（Markdown 解析）
- highlight.js（代码高亮）
- html2canvas + jsPDF（PDF 导出）
- lucide-react（图标）

## 安装和使用

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 使用方法

### 打开本地文件
1. 点击左侧导航栏的文件夹图标
2. 选择本地的 .md 文件
3. 文件会自动加载到编辑器

### 保存文件
- 点击工具栏的保存按钮
- 或按 Ctrl+S
- 已打开的文件会直接同步到原文件

### 创建新笔记
- 点击左侧的 + 按钮
- 或按 Ctrl+N

## License

MIT