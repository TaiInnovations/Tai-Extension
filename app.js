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
    `;
    
    chatBtn.addEventListener('click', () => {
      if (parseInt(chat.id) !== parseInt(currentChatId)) {
        switchChat(chat.id);
      }
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
      const messageElement = document.createElement('div');
      messageElement.className = `message ${message.type}`;
      
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      
      const content = document.createElement('div');
      content.className = 'content';
      content.textContent = message.text;
      
      messageElement.appendChild(avatar);
      messageElement.appendChild(content);
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
    
    // 调用 Open Router API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${geminiApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/tassel',
        'X-Title': 'Tai Chat'
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: message
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // 添加 AI 响应
    addMessage(aiResponse, 'ai');
  } catch (error) {
    addMessage(`错误: ${error.message}`, 'error');
  }
}

function addMessage(text, type) {
  const currentChat = chats.find(chat => parseInt(chat.id) === parseInt(currentChatId));
  if (!currentChat) return;

  const message = {
    id: Date.now(),
    text,
    type,
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