# Tai Chat - AI Chat Assistant

[English](README.md) | [中文](docs/README_zh.md)

Tai Chat is a browser extension based on the OpenRouter API and Zhipu AI API that allows you to easily chat with various AI models.

## Features

- 🤖 Multiple AI Models Support (Gemini Series, GLM Series, etc.)
- 💬 Clean Chat Interface
- 🎨 Code Syntax Highlighting
- 📝 Markdown Support
- 🔄 Chat Session Management
- ⚙️ Simple Settings Interface
- 📸 Export Chat Messages as Images
- 🖼️ Image Support for Gemini Models
- 🗑️ Message and Session Management

## Installation

1. Install from Store (Recommended)
   - [Chrome Web Store](https://chromewebstore.google.com/detail/tai-chat/oipligpjckkblgcneidlchoelogndigf)
   - [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tai-chat/ejpblckkpobpknondgkfhfmddkeklnpa)

2. Manual Installation
   - Clone or download this repository
   ```bash
   git clone https://github.com/yourusername/Tai-Extension.git
   ```

   - Load in Browser
     - Open Chrome/Edge browser
     - Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
     - Enable "Developer mode" in the top right
     - Click "Load unpacked" in the top left
     - Select the extension folder you downloaded

## Usage

1. Get API Keys
   - Visit [OpenRouter](https://openrouter.ai/keys) to obtain your OpenRouter API Key
   - Visit [Zhipu AI](https://open.bigmodel.cn/usercenter/apikeys) to obtain your GLM API Key
   - Enter your API Keys in the extension settings

2. Select Model
   - Choose your preferred AI model in settings
   - Multiple models available:
     - Gemini series models (requires OpenRouter API Key, supports image input)
     - GLM-4 Flash (requires GLM API Key)

3. Start Chatting
   - Click "New Chat" to start a new conversation
   - Type your message in the input box
   - Press Enter to send (Shift + Enter for new line)
   - Click the image icon to upload and send images (Gemini models only)
   - Images are limited to 5MB in size

4. Manage Sessions
   - View all chat sessions in the left sidebar
   - Switch between or delete sessions as needed
   - Delete individual messages using the menu in each message
   - Delete entire conversations using the delete button in the sidebar

5. Export Chat Messages
   - Hover over any AI response message
   - Click the menu icon in the top-right corner
   - Choose "Save as Image" to save the message as a PNG image
   - Choose "Delete Message" to remove individual messages

## Shortcuts

- `Enter`: Send message
- `Shift + Enter`: New line
- Settings icon click: Toggle settings page

## Notes

- Keep your API Keys secure
- You only need to configure the API Key for the model type you want to use
- Ensure stable internet connection
- If issues occur, try refreshing or reloading the extension

## Development

- Built with vanilla JavaScript
- Uses Chrome Extension Manifest V3
- Features real-time code highlighting and Markdown rendering

### Build Extension

1. Make sure you have `zip` command installed
2. Run the build script:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```
3. The packaged extension will be available in the `dist` directory

## License

MIT License