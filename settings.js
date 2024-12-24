document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const modelSelect = document.getElementById('model');
  const saveButton = document.getElementById('save');
  const statusDiv = document.getElementById('status');

  // 加载已保存的设置
  chrome.storage.local.get(['geminiApiKey', 'selectedModel'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
    if (result.selectedModel) {
      modelSelect.value = result.selectedModel;
    }
  });

  // 保存设置
  saveButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) {
      showStatus('请输入 API Key', 'error');
      return;
    }

    try {
      // 验证 API Key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('API Key 无效');
      }

      // 保存设置
      await chrome.storage.local.set({
        geminiApiKey: apiKey,
        selectedModel: selectedModel
      });

      showStatus('设置已保存', 'success');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // 3秒后隐藏成功消息
    if (type === 'success') {
      setTimeout(() => {
        statusDiv.className = 'status';
      }, 3000);
    }
  }
}); 