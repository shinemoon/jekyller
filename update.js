// 获取并显示当前版本
let version = 'unknown';
try {
  if (chrome && chrome.runtime && chrome.runtime.getManifest) {
    version = chrome.runtime.getManifest().version;
  }
} catch (e) {
  console.warn('Failed to get version:', e);
}
document.getElementById('version').textContent = 'v' + version;

// 更新 GitHub 链接（可根据项目实际情况修改）
const releaseLink = document.getElementById('releaseLink');
releaseLink.href = 'https://github.com/your-repo/releases'; // 替换为实际仓库地址

// 保存版本号并关闭页面
function closeAndSave() {
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'lastSeenVersion': version }, function() {
        console.log('Version saved:', version);
        window.close();
      });
      return;
    }
  } catch (e) {
    console.warn('Failed to save version:', e);
  }
  window.close();
}

// 绑定按钮事件
document.getElementById('okBtn').addEventListener('click', closeAndSave);
//document.getElementById('dismissBtn').addEventListener('click', closeAndSave);
