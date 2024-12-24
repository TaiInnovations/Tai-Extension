// 监听扩展安装事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Tai Chat 扩展已安装');
});

// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
  // 打开新标签页
  chrome.tabs.create({
    url: chrome.runtime.getURL('index.html')
  });
}); 