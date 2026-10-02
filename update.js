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

// 立即把当前版本写到 storage（local + sync），覆盖旧值。
// 之所以在页面加载时也写一次而不是只在 OK 时写，是为了避免用户在
// 弹窗里没点 OK（直接关 tab / 拦截弹窗 / 标签页被回收）导致
// storage 永远没有 lastSeenVersion，进而每次启动都重复弹更新页。
function persistVersionNow() {
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'lastSeenVersion': version });
    }
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set({ 'lastSeenVersion': version });
    }
  } catch (e) {
    console.warn('Failed to save version:', e);
  }
}
persistVersionNow();

// 关闭并保存：点 OK 时刷新一下 dismiss 时间戳，确保下次冷启动
// 在冷却窗口内不会重复弹。
function closeAndSave() {
  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 'lastSeenVersion': version, 'lastUpdateDismissedAt': Date.now() }, function () {
        try {
          if (chrome.storage.sync) {
            chrome.storage.sync.set({ 'lastSeenVersion': version, 'lastUpdateDismissedAt': Date.now() });
          }
        } catch (e) { /* ignore */ }
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