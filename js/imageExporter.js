class ImageExporter {
  static async exportToImage(content) {
    // 创建临时容器用于生成图片
    const tempContainer = document.createElement('div');
    tempContainer.className = 'message-for-image';
    tempContainer.style.cssText = `
      padding: 40px 48px;
      background: transparent;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    `;
    
    // 复制消息内容
    const messageContent = document.createElement('div');
    messageContent.className = 'content';
    messageContent.style.cssText = `
      padding: 32px;
      background: #f8f9fa;
      line-height: 1.6;
      color: #2c3e50;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      margin-bottom: 32px;
      border-radius: 8px;
      font-size: 15px;
    `;
    messageContent.innerHTML = content.innerHTML;
    
    // 添加样式以确保代码高亮等样式正确显示
    messageContent.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
    
    // 添加代码块的样式
    messageContent.querySelectorAll('pre').forEach(pre => {
      pre.style.cssText = `
        background: #ffffff;
        padding: 20px;
        margin: 1.2em 0;
        border: 1px solid #edf2f7;
        position: relative;
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
        font-size: 14px;
        line-height: 1.6;
        overflow-x: auto;
        border-radius: 4px;
      `;
    });

    // 优化内联代码样式
    messageContent.querySelectorAll('code:not(pre code)').forEach(code => {
      code.style.cssText = `
        background: #f1f5f9;
        padding: 2px 6px;
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
        font-size: 0.9em;
        color: #475569;
        border-radius: 3px;
      `;
    });

    // 优化列表样式
    messageContent.querySelectorAll('ul, ol').forEach(list => {
      list.style.cssText = `
        margin: 0.8em 0;
        padding-left: 1.5em;
      `;
    });

    messageContent.querySelectorAll('li').forEach(item => {
      item.style.cssText = `
        margin: 0.4em 0;
        line-height: 1.6;
      `;
    });
    
    tempContainer.appendChild(messageContent);

    // 添加分割线和水印
    const watermarkContainer = document.createElement('div');
    watermarkContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 20px;
      color: #94a3b8;
      font-size: 13px;
      padding: 0 16px;
      margin-top: 4px;
    `;

    // 左侧分割线
    const leftLine = document.createElement('div');
    leftLine.style.cssText = `
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, transparent, #e2e8f0);
      border-radius: 1px;
    `;
    
    // 水印文字
    const watermark = document.createElement('div');
    watermark.style.cssText = `
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      letter-spacing: 0.5px;
      opacity: 0.8;
    `;
    watermark.textContent = '通过 Tai Chat 生成';
    
    // 右侧分割线
    const rightLine = document.createElement('div');
    rightLine.style.cssText = `
      flex: 1;
      height: 1px;
      background: linear-gradient(to left, transparent, #e2e8f0);
      border-radius: 1px;
    `;
    
    watermarkContainer.appendChild(leftLine);
    watermarkContainer.appendChild(watermark);
    watermarkContainer.appendChild(rightLine);
    tempContainer.appendChild(watermarkContainer);
    
    document.body.appendChild(tempContainer);
    
    try {
      // 等待样式加载
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 使用 html2canvas 生成图片
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: function(clonedDoc) {
          const clonedContent = clonedDoc.querySelector('.message-for-image');
          if (clonedContent) {
            clonedContent.style.transform = 'none';
            clonedContent.style.display = 'block';
          }
        }
      });
      
      // 转换为图片并下载
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `tai-chat-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('生成图片失败:', error);
      throw error;
    } finally {
      // 清理临时元素
      document.body.removeChild(tempContainer);
    }
  }

  static showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffebee;
      color: #c62828;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      z-index: 1000;
      font-size: 14px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 3000);
  }
} 