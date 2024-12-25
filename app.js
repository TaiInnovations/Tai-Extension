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
const modelSelect = document.getElementById('model');
const saveSettingsButton = document.getElementById('save-settings');
const settingsStatus = document.getElementById('settings-status');
const togglePasswordButton = document.getElementById('toggle-password');
const chatCountSpan = document.querySelector('.chat-header span');

// 常量
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';
const EYE_OPEN = 'M12 4.5c-5 0-9.27 3.11-11 7.5 1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z';
const EYE_CLOSED = 'M12 6.5c3.79 0 7.17 2.13 8.82 5.5-1.65 3.37-5.02 5.5-8.82 5.5S4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5m0-2C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5-2.5-1.12-2.5-2.5 1.12-2.5 2.5-2.5m0-2c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5z';

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
  } catch (error) {
    console.error('初始化失败:', error);
  }
});

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
    switchPage(isSettingsActive ? 'chat' : 'settings');
  });

  // 密码显示切换
  togglePasswordButton.addEventListener('click', () => {
    const isShown = apiKeyInput.classList.toggle('show');
    togglePasswordButton.querySelector('path').setAttribute(
      'd',
      isShown ? EYE_CLOSED : EYE_OPEN
    );
  });

  // 保存设置
  saveSettingsButton.addEventListener('click', saveSettings);
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
    
    chatBtn.innerHTML = `
      <div class="title">${chat.title}</div>
      <div class="chat-count">${chat.messageCount || 0} 条对话</div>
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
  
  // 更新消息计数
  messageCount = currentChat.messageCount || 0;
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
  if (page === 'chat') {
    chatPage.classList.add('active');
    settingsPage.classList.remove('active');
    navSettingsButton.classList.remove('active');
  } else if (page === 'settings') {
    settingsPage.classList.add('active');
    chatPage.classList.remove('active');
    navSettingsButton.classList.add('active');
  }
}

// 设置相关函数
async function loadSettings() {
  const { geminiApiKey, selectedModel } = await chrome.storage.local.get(['geminiApiKey', 'selectedModel']);
  if (geminiApiKey) {
    apiKeyInput.value = geminiApiKey;
  }
  if (selectedModel) {
    modelSelect.value = selectedModel;
  } else {
    modelSelect.value = DEFAULT_MODEL;
  }
}

async function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const selectedModel = modelSelect.value;

  if (!apiKey) {
    showSettingsStatus('请输入 API Key', 'error');
    return;
  }

  try {
    // 验证 API Key
    const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('API Key 无效');
    }

    // 保存设置
    await chrome.storage.local.set({
      geminiApiKey: apiKey,
      selectedModel: selectedModel
    });

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
    const { geminiApiKey, selectedModel } = await chrome.storage.local.get(['geminiApiKey', 'selectedModel']);
    if (!geminiApiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    const model = selectedModel || DEFAULT_MODEL;
    
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
    currentChat.messageCount = (currentChat.messageCount || 0) + 1;
    
    messageCount = currentChat.messageCount;
    chatCountSpan.textContent = `共 ${messageCount} 条对话`;
    displayCurrentChat();
    
    // 调用 Open Router API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
  currentChat.messageCount = (currentChat.messageCount || 0) + 1;
  
  // 更新第一条消息作为标题
  if (currentChat.messages.length === 1 && type === 'user') {
    currentChat.title = text.slice(0, 20) + (text.length > 20 ? '...' : '');
    updateChatList();
  }
  
  messageCount = currentChat.messageCount;
  chatCountSpan.textContent = `共 ${messageCount} 条对话`;
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
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  
  const content = document.createElement('div');
  content.className = 'content';
  
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
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);
  
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