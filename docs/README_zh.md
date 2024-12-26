# Tai Chat - AI 聊天助手

[English](../README.md) | [中文](README_zh.md)

Tai Chat 是一个基于 OpenRouter API 和智谱 AI API 的浏览器扩展，让你可以方便地使用各种 AI 模型进行对话。

## 功能特点

- 🤖 支持多个 AI 模型（Gemini 系列、GLM 系列等）
- 💬 简洁的聊天界面
- 🎨 代码高亮显示
- 📝 Markdown 格式支持
- 🔄 会话管理
- ⚙️ 简单的设置界面
- 📸 会话内容导出为图片

## 安装步骤

1. 下载扩展
   - 克隆或下载此仓库到本地
   ```bash
   git clone https://github.com/yourusername/Tai-Extension.git
   ```

2. 在 Chrome 浏览器中加载扩展
   - 打开 Chrome 浏览器
   - 在地址栏输入 `chrome://extensions/`
   - 打开右上角的 "开发者模式"
   - 点击左上角的 "加载已解压的扩展程序"
   - 选择你下载的扩展文件夹

## 使用方法

1. 获取 API Keys
   - 访问 [OpenRouter](https://openrouter.ai/keys) 获取 OpenRouter API Key
   - 访问 [智谱 AI](https://open.bigmodel.cn/usercenter/apikeys) 获取 GLM API Key
   - 在扩展的设置页面中填入你的 API Keys

2. 选择模型
   - 在设置页面选择你想使用的 AI 模型
   - 目前支持的模型：
     - Gemini 系列模型（需要 OpenRouter API Key）
     - GLM-4 Flash（需要 GLM API Key）

3. 开始对话
   - 点击 "新的聊天" 开始一个新的对话
   - 在输入框中输入你的问题
   - 按 Enter 发送消息（Shift + Enter 换行）

4. 管理会话
   - 左侧边栏显示所有会话记录
   - 可以随时切换或删除会话

5. 导出会话内容
   - 将鼠标悬停在任意 AI 回复消息上
   - 点击右上角的下载图标
   - 消息内容将保存为透明背景的 PNG 图片

## 快捷键

- `Enter`: 发送消息
- `Shift + Enter`: 换行
- 点击设置图标：打开/关闭设置页面

## 注意事项

- 请妥善保管你的 API Keys
- 你只需要配置想要使用的模型对应的 API Key
- 确保有稳定的网络连接
- 如遇到问题，可以尝试刷新页面或重新加载扩展

## 开发相关

- 本扩展使用原生 JavaScript 开发
- 使用 Chrome Extension Manifest V3
- 支持实时代码高亮和 Markdown 渲染

## 许可证

MIT License 