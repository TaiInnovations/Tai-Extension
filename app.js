// 全局变量
let chats = [];
let currentChatId = null;
let messageCount = 0;

// DOM 元素
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-btn');
const navSettingsButton = document.getElementById('nav-settings');
const chatPage = document.getElementById('chat-page');
const settingsPage = document.getElementById('settings-page');
const apiKeyInput = document.getElementById('api-key');
const glmApiKeyInput = document.getElementById('glm-api-key');
const modelSelect = document.getElementById('model');
const saveSettingsButton = document.getElementById('save-settings');
const settingsStatus = document.getElementById('settings-status');
const togglePasswordButton = document.getElementById('toggle-password');
const toggleGlmPasswordButton = document.getElementById('toggle-glm-password');
const chatCountSpan = document.querySelector('.chat-header span');

// 常量
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';
const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-exp-1206:free', name: 'Gemini Exp 1206' },
  { id: 'google/gemini-exp-1121:free', name: 'Gemini Exp 1121' },
  { id: 'google/learnlm-1.5-pro-experimental:free', name: 'LearnLM 1.5 Pro' },
  { id: 'google/gemini-exp-1114:free', name: 'Gemini Exp 1114' },
  { id: 'google/gemini-2.0-flash-thinking-exp:free', name: 'Gemini 2.0 Flash Thinking' },
  { id: 'glm-4-flash', name: 'GLM-4 Flash' }
];
const EYE_OPEN = 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z';
const EYE_CLOSED = 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88';

// 初始化 marked 配置
marked.setOptions({
  breaks: true,
  gfm: true,
  mangle: false,
  headerIds: false,
  pedantic: false,
  smartLists: true,
  smartypants: true,
  highlight: function(code, language) {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(code, { language }).value;
      } catch (err) {
        console.error('代码高亮错误:', err);
      }
    }
    try {
      return hljs.highlightAuto(code).value;
    } catch (err) {
      console.error('自动代码高亮错误:', err);
    }
    return code; // 如果高亮失败，返回原始代码
  }
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 加载设置
    await loadSettings();
    
    // 加载聊天数据
    const data = await chrome.storage.local.get(['chats', 'currentChatId']);
    chats = data.chats || [];
    currentChatId = data.currentChatId;
    
    // 如果没有聊天，创建一个新的
    if (chats.length === 0) {
      createNewChat();
    } else if (!currentChatId || !chats.find(chat => chat.id === currentChatId)) {
      currentChatId = chats[0].id;
    }
    
    // 更新界面
    updateChatList();
    displayCurrentChat();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始化模型选择器
    initializeModelSelectors();
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

// 初始化模型选择器
function initializeModelSelectors() {
  const modelSelect = document.getElementById('model-select');
  const modelDropdown = document.querySelector('.model-dropdown');
  
  // 获取当前选中的模型
  chrome.storage.local.get(['selectedModel'], ({ selectedModel }) => {
    const currentModelId = selectedModel || DEFAULT_MODEL;
    
    // 更新设置页面的模型选择下拉框
    if (modelSelect) {
      modelSelect.innerHTML = AVAILABLE_MODELS.map(model => `
        <option value="${model.id}" ${model.id === currentModelId ? 'selected' : ''}>
          ${model.name}
        </option>
      `).join('');
      
      // 监听模型选择变化
      modelSelect.addEventListener('change', (e) => {
        const selectedModel = AVAILABLE_MODELS.find(model => model.id === e.target.value);
        if (selectedModel) {
          switchModel(selectedModel.id, selectedModel.name);
        }
      });
    }
    
    // 更新聊天页面的模型选择器
    if (modelDropdown) {
      modelDropdown.innerHTML = '';
      AVAILABLE_MODELS.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option';
        if (model.id === currentModelId) {
          option.classList.add('selected');
        }
        
        option.innerHTML = `
          <span>${model.name}</span>
          ${model.id === currentModelId ? '<span>✓</span>' : ''}
        `;
        
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          switchModel(model.id, model.name);
          document.getElementById('current-model').classList.remove('active');
        });
        
        modelDropdown.appendChild(option);
      });
      
      // 更新显示的模型名称
      const modelName = AVAILABLE_MODELS.find(model => model.id === currentModelId)?.name;
      if (modelName) {
        document.querySelector('.model-name').textContent = modelName;
      }
    }
  });
}

// 事件监听器设置
function setupEventListeners() {
  // 发送消息
  sendButton.addEventListener('click', sendMessage);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 新建聊天
  document.getElementById('new-chat').addEventListener('click', createNewChat);

  // 设置按钮
  navSettingsButton.addEventListener('click', () => {
    const isSettingsActive = settingsPage.classList.contains('active');
    if (isSettingsActive) {
      // 如果当前在设置页面，切换回聊天页面并显示当前会话
      switchPage('chat');
      displayCurrentChat();
    } else {
      // 如果当前在聊天页面，切换到设置页面
      switchPage('settings');
    }
  });

  // 密码显示切换
  togglePasswordButton.addEventListener('click', () => {
    const isShown = apiKeyInput.classList.toggle('show');
    const eyePath = togglePasswordButton.querySelector('path');
    eyePath.setAttribute(
      'd',
      isShown ? EYE_CLOSED : EYE_OPEN
    );
    togglePasswordButton.setAttribute('title', isShown ? '隐藏' : '显示');
    apiKeyInput.type = isShown ? 'text' : 'password';
  });

  // GLM 密码显示切换
  toggleGlmPasswordButton.addEventListener('click', () => {
    const isShown = glmApiKeyInput.classList.toggle('show');
    const eyePath = toggleGlmPasswordButton.querySelector('path');
    eyePath.setAttribute(
      'd',
      isShown ? EYE_CLOSED : EYE_OPEN
    );
    toggleGlmPasswordButton.setAttribute('title', isShown ? '隐藏' : '显示');
    glmApiKeyInput.type = isShown ? 'text' : 'password';
  });

  // 保存设置
  saveSettingsButton.addEventListener('click', saveSettings);

  // 模型选择器
  const modelSelector = document.getElementById('current-model');
  const modelDropdown = document.querySelector('.model-dropdown');
  
  if (modelSelector && modelDropdown) {
    // 清空并重新创建下拉菜单选项
    modelDropdown.innerHTML = '';
    
    // 获取当前选中的模型
    chrome.storage.local.get(['selectedModel'], ({ selectedModel }) => {
      const currentModelId = selectedModel || DEFAULT_MODEL;
      
      // 创建模型选项
      AVAILABLE_MODELS.forEach(model => {
        const option = document.createElement('div');
        option.className = 'model-option';
        if (model.id === currentModelId) {
          option.classList.add('selected');
        }
        
        option.innerHTML = `
          <span>${model.name}</span>
          ${model.id === currentModelId ? '<span>✓</span>' : ''}
        `;
        
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          switchModel(model.id, model.name);
          modelSelector.classList.remove('active');
        });
        
        modelDropdown.appendChild(option);
      });
    });
    
    // 切换下拉菜单显示
    modelSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      modelSelector.classList.toggle('active');
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', () => {
      modelSelector.classList.remove('active');
    });
    
    // 防止下拉菜单点击事件冒泡
    modelDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// 聊天相关函数
function createNewChat() {
  const newChat = {
    id: Date.now(),
    title: '新的聊天',
    messages: [],
    messageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  chats.unshift(newChat);
  currentChatId = newChat.id;
  
  updateChatList();
  displayCurrentChat();
  saveToStorage();
  
  if (userInput) {
    userInput.value = '';
    userInput.focus();
  }
}

function updateChatList() {
  const chatList = document.querySelector('.chat-list');
  chatList.innerHTML = '';
  
  chats.forEach(chat => {
    const chatBtn = document.createElement('button');
    chatBtn.className = 'chat-item';
    chatBtn.dataset.chatId = chat.id;
    
    if (parseInt(chat.id) === parseInt(currentChatId)) {
      chatBtn.classList.add('active');
    }
    
    // 格式化时间
    const date = new Date(chat.createdAt);
    const formattedDate = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // 计算实际的消息数量
    const messageCount = chat.messages ? chat.messages.length : 0;
    
    chatBtn.innerHTML = `
      <div class="info">
        <div class="title">${chat.title}</div>
        <div class="meta">
          <span class="chat-count">${messageCount} 条对话</span>
          <span class="timestamp">${formattedDate}</span>
        </div>
      </div>
      <button class="delete-btn" title="删除会话">×</button>
    `;
    
    // 点击聊天项切换聊天
    chatBtn.addEventListener('click', (e) => {
      // 如果点击的是删除按钮，不切换聊天
      if (e.target.classList.contains('delete-btn')) {
        return;
      }
      // 总是切换到聊天页面，即使是当前聊天
      switchChat(chat.id);
    });
    
    // 删除按钮点击事件
    const deleteBtn = chatBtn.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteChat(chat.id);
    });
    
    chatList.appendChild(chatBtn);
  });
}

function switchChat(chatId) {
  const id = parseInt(chatId);
  const chat = chats.find(c => parseInt(c.id) === id);
  
  if (!chat) return;
  
  currentChatId = id;
  
  // 切换到聊天页面
  switchPage('chat');
  
  // 更新聊天内容
  displayCurrentChat();
  saveToStorage();
  
  // 更新列表选中状态
  const allChatItems = document.querySelectorAll('.chat-item');
  allChatItems.forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.chatId) === id);
  });
}

function displayCurrentChat() {
  const currentChat = chats.find(chat => parseInt(chat.id) === parseInt(currentChatId));
  if (!currentChat) return;
  
  // 确保消息计数正确
  currentChat.messageCount = currentChat.messages ? currentChat.messages.length : 0;
  messageCount = currentChat.messageCount;
  chatCountSpan.textContent = `共 ${messageCount} 条对话`;
  
  // 清空并显示消息
  chatMessages.innerHTML = '';
  
  if (currentChat.messages && currentChat.messages.length > 0) {
    currentChat.messages.forEach(message => {
      const messageElement = renderMessage(message);
      chatMessages.appendChild(messageElement);
    });
  }
  
  // 滚动到底部
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 页面切换
function switchPage(page) {
  const chatPage = document.getElementById('chat-page');
  const settingsPage = document.getElementById('settings-page');
  const navSettingsButton = document.getElementById('nav-settings');
  const allChatItems = document.querySelectorAll('.chat-item');

  if (page === 'settings') {
    chatPage.classList.remove('active');
    settingsPage.classList.add('active');
    navSettingsButton.classList.add('active');
    // 移除会话列表的选中状态
    allChatItems.forEach(item => item.classList.remove('active'));
  } else {
    chatPage.classList.add('active');
    settingsPage.classList.remove('active');
    navSettingsButton.classList.remove('active');
    // 恢复当前会话的选中状态
    allChatItems.forEach(item => {
      item.classList.toggle('active', parseInt(item.dataset.chatId) === parseInt(currentChatId));
    });
  }
}

// 设置相关函数
async function loadSettings() {
  const { geminiApiKey, glmApiKey, selectedModel } = await chrome.storage.local.get(['geminiApiKey', 'glmApiKey', 'selectedModel']);
  if (geminiApiKey) {
    apiKeyInput.value = geminiApiKey;
  }
  if (glmApiKey) {
    glmApiKeyInput.value = glmApiKey;
  }
  
  // 更新当前选中的模型显示
  const currentModel = AVAILABLE_MODELS.find(model => model.id === (selectedModel || DEFAULT_MODEL));
  if (currentModel) {
    document.querySelector('.model-name').textContent = currentModel.name;
  }
}

async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const glmApiKey = glmApiKeyInput.value.trim();
  const modelSelect = document.getElementById('model-select');
  const selectedModel = modelSelect ? modelSelect.value : DEFAULT_MODEL;

  try {
    // 如果设置了 OpenRouter API Key，则验证它
    if (apiKey) {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('OpenRouter API Key 无效');
      }
    }

    // 检查当前选中的模型是否与已设置的 Key 匹配
    if (selectedModel.startsWith('glm') && !glmApiKey) {
      throw new Error('使用 GLM 模型需要配置 GLM API Key');
    }
    if (!selectedModel.startsWith('glm') && !apiKey) {
      throw new Error('使用 OpenRouter 模型需要配置 API Key');
    }

    // 保存设置
    const settings = {};
    if (apiKey) settings.geminiApiKey = apiKey;
    if (glmApiKey) settings.glmApiKey = glmApiKey;
    settings.selectedModel = selectedModel;

    await chrome.storage.local.set(settings);

    // 更新模型选择器
    const selectedModelData = AVAILABLE_MODELS.find(model => model.id === selectedModel);
    if (selectedModelData) {
      switchModel(selectedModelData.id, selectedModelData.name);
    }

    showSettingsStatus('设置已保存', 'success');
    setTimeout(() => switchPage('chat'), 1500);
  } catch (error) {
    showSettingsStatus(error.message, 'error');
  }
}

function showSettingsStatus(message, type) {
  settingsStatus.textContent = message;
  settingsStatus.className = `status ${type}`;
  
  if (type === 'success') {
    setTimeout(() => {
      settingsStatus.className = 'status';
    }, 3000);
  }
}

// 消息处理
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // 添加用户消息
  addMessage(message, 'user');
  userInput.value = '';

  try {
    // 获取设置
    const { geminiApiKey, glmApiKey, selectedModel } = await chrome.storage.local.get(['geminiApiKey', 'glmApiKey', 'selectedModel']);
    const model = selectedModel || DEFAULT_MODEL;

    // 检查 API Key
    if (model.startsWith('glm')) {
      if (!glmApiKey) {
        throw new Error('请先在设置中配置 GLM API Key');
      }
    } else {
      if (!geminiApiKey) {
        throw new Error('请先在设置中配置 API Key');
      }
    }
    
    // 创建 AI 消息占位
    const aiMessage = {
      id: Date.now(),
      content: '',
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    
    const currentChat = chats.find(chat => parseInt(chat.id) === parseInt(currentChatId));
    if (!currentChat) return;
    
    currentChat.messages = currentChat.messages || [];
    currentChat.messages.push(aiMessage);
    
    // 更新界面显示
    updateChatList();
    displayCurrentChat();

    let response;
    
    // 根据模型选择不同的 API
    if (model.startsWith('glm')) {
      // 获取历史消息
      const history = currentChat.messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // 添加当前消息
      history.push({
        role: 'user',
        content: message
      });

      // 调用智谱 AI API
      response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${glmApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: history,
          stream: true,
          temperature: 0.7,
          top_p: 0.7,
          max_tokens: 1500,
          stop: [],
          request_id: Date.now().toString(),
          do_sample: true,
          repetition_penalty: 1.1
        })
      });
    } else {
      // 调用 Open Router API
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${geminiApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/tassel',
          'X-Title': 'Tai Chat',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          model: model,
          messages: [{
            role: 'user',
            content: message
          }],
          stream: true
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API 请求失败');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // 处理缓冲区中的完整事件
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          // 处理特殊的状态消息
          if (trimmedLine === ': OPENROUTER PROCESSING' || trimmedLine === 'data: [DONE]') {
            continue;
          }
          
          // 确保行以 'data: ' 开头
          if (!trimmedLine.startsWith('data: ')) {
            console.log('跳过非数据行:', trimmedLine);
            continue;
          }
          
          // 移除 'data: ' 前缀并解析 JSON
          const jsonStr = trimmedLine.slice(6);
          
          try {
            const event = JSON.parse(jsonStr);
            if (!event.choices || !event.choices.length) continue;
            
            const delta = event.choices[0].delta;
            if (!delta || !delta.content) continue;
            
            // 更新消息内容
            aiMessage.content += delta.content;
            updateChatList();
            displayCurrentChat();
            
            // 滚动到底部
            chatMessages.scrollTop = chatMessages.scrollHeight;
          } catch (e) {
            console.log('无法解析的数据:', jsonStr);
            continue;
          }
        }
      }
    } catch (streamError) {
      console.error('流式处理错误:', streamError);
      // 即使流处理出错，也保留已经生成的内容
    } finally {
      // 完成后确保内容被保存
      if (aiMessage.content) {
        saveToStorage();
      }
    }
  } catch (error) {
    console.error('API 错误:', error);
    addMessage(error.message, 'error');
  }
}

function addMessage(text, type) {
  const currentChat = chats.find(chat => parseInt(chat.id) === parseInt(currentChatId));
  if (!currentChat) return;

  const message = {
    id: Date.now(),
    content: text || '',
    role: type,
    timestamp: new Date().toISOString()
  };

  currentChat.messages = currentChat.messages || [];
  currentChat.messages.push(message);
  
  // 更新第一条消息作为标题
  if (currentChat.messages.length === 1 && type === 'user') {
    currentChat.title = text.slice(0, 20) + (text.length > 20 ? '...' : '');
  }
  
  // 更新界面
  updateChatList();
  displayCurrentChat();
  saveToStorage();
}

// 存储相关
function saveToStorage() {
  chrome.storage.local.set({
    chats,
    currentChatId
  });
}

// 渲染消息
function renderMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${message.role}`;
  
  // 创建消息内容容器
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'message-content';
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  
  const content = document.createElement('div');
  content.className = 'content';
  
  // 如果是 AI 回复消息，添加保存图片按钮
  if (message.role === 'assistant') {
    const actionButtons = document.createElement('div');
    actionButtons.className = 'message-actions';
    
    const saveImageBtn = document.createElement('button');
    saveImageBtn.className = 'save-image-btn';
    saveImageBtn.title = '保存为图片';
    saveImageBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    `;
    
    saveImageBtn.onclick = async () => {
      try {
        if (typeof html2canvas === 'undefined') {
          throw new Error('html2canvas 库未加载，请刷新页面重试');
        }

        // 显示加载状态
        const originalText = saveImageBtn.innerHTML;
        saveImageBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⌛</span>';
        saveImageBtn.style.pointerEvents = 'none';

        // 使用 ImageExporter 导出图片
        await ImageExporter.exportToImage(content);

        // 恢复按钮状态
        saveImageBtn.innerHTML = originalText;
        saveImageBtn.style.pointerEvents = 'auto';

        // 添加成功动画
        saveImageBtn.innerHTML = '✓';
        setTimeout(() => {
          saveImageBtn.innerHTML = originalText;
        }, 1000);
      } catch (error) {
        console.error('保存图片失败:', error);
        ImageExporter.showError(error.message || '保存图片失败，请重试');

        // 恢复按钮状态
        saveImageBtn.innerHTML = originalText;
        saveImageBtn.style.pointerEvents = 'auto';
      }
    };
    
    actionButtons.appendChild(saveImageBtn);
    messageDiv.appendChild(actionButtons);
  }
  
  // 使用 marked 解析 Markdown
  if (message.role === 'error') {
    content.textContent = message.content || '未知错误';
  } else {
    // 预处理代码块，确保语言标记正确
    let processedContent = message.content || '';
    processedContent = processedContent.replace(/```(\w+)?\n/g, (match, lang) => {
      return `\`\`\`${lang || 'plaintext'}\n`;
    });
    
    content.innerHTML = marked.parse(processedContent);
    
    // 处理没有指定语言的代码块
    content.querySelectorAll('pre code:not([class])').forEach(block => {
      block.className = 'language-plaintext';
    });
    
    // 应用代码高亮
    content.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
      
      // 添加复制按钮
      const pre = block.parentElement;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '复制';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(block.innerText);
          copyBtn.textContent = '已复制';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = '复制';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('复制失败:', err);
        }
      });
      pre.appendChild(copyBtn);
    });
  }
  
  contentWrapper.appendChild(avatar);
  contentWrapper.appendChild(content);
  
  // 添加时间戳
  const timestamp = document.createElement('div');
  timestamp.className = 'timestamp';
  const date = new Date(message.timestamp);
  timestamp.textContent = date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  messageDiv.appendChild(contentWrapper);
  messageDiv.appendChild(timestamp);
  
  return messageDiv;
}

// 删除聊天
function deleteChat(chatId) {
  const id = parseInt(chatId);
  
  // 找到要删除的聊天索引
  const index = chats.findIndex(chat => parseInt(chat.id) === id);
  if (index === -1) return;
  
  // 删除聊天
  chats.splice(index, 1);
  
  // 如果删除后没有聊天了，创建新的
  if (chats.length === 0) {
    createNewChat();
  } else if (parseInt(currentChatId) === id) {
    // 如果删除的是当前聊天，切换到下一个或上一个
    const nextChat = chats[index] || chats[index - 1];
    currentChatId = nextChat.id;
  }
  
  // 更新界面
  updateChatList();
  displayCurrentChat();
  saveToStorage();
}

// 切换模型
async function switchModel(modelId, modelName) {
  try {
    // 检查如果是 GLM 模型，需要验证 GLM API Key
    if (modelId.startsWith('glm')) {
      const { glmApiKey } = await chrome.storage.local.get(['glmApiKey']);
      if (!glmApiKey) {
        showSettingsStatus('请先配置 GLM API Key', 'error');
        // 切换回默认模型
        const defaultModel = AVAILABLE_MODELS.find(model => model.id === DEFAULT_MODEL);
        if (defaultModel) {
          modelId = defaultModel.id;
          modelName = defaultModel.name;
        }
        return;
      }
    }

    await chrome.storage.local.set({ selectedModel: modelId });
    
    // 更新聊天页面的模型显示
    const modelNameElement = document.querySelector('.model-name');
    if (modelNameElement) {
      modelNameElement.textContent = modelName;
    }
    
    // 更新聊天页面的下拉菜单选中状态
    const options = document.querySelectorAll('.model-option');
    options.forEach(option => {
      const isSelected = option.querySelector('span').textContent === modelName;
      option.classList.toggle('selected', isSelected);
      option.innerHTML = `
        <span>${option.querySelector('span').textContent}</span>
        ${isSelected ? '<span>✓</span>' : ''}
      `;
    });
    
    // 更新设置页面的模型选择
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) {
      modelSelect.value = modelId;
    }
  } catch (error) {
    console.error('切换模型失败:', error);
    showSettingsStatus('切换模型失败', 'error');
  }
} 