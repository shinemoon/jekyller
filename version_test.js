// 日志功能
function addLog(action, detail = '') {
  const logContainer = document.getElementById('logContainer');
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-action">${action}</span> ${detail}`;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// 更新状态显示
function updateStatus() {
  try {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    document.getElementById('currentVersion').textContent = currentVersion;

    chrome.storage.local.get(['lastSeenVersion'], function(result) {
      const storedVersion = result.lastSeenVersion || '未设置';
      document.getElementById('storedVersion').textContent = storedVersion;

      const statusEl = document.getElementById('notificationStatus');
      if (!result.lastSeenVersion) {
        statusEl.innerHTML = '<span class="badge warning">未初始化</span>';
        addLog('状态检查', '未找到版本记录，将触发通知');
      } else if (result.lastSeenVersion !== currentVersion) {
        statusEl.innerHTML = '<span class="badge info">版本已更新</span>';
        addLog('状态检查', `版本不匹配：${result.lastSeenVersion} → ${currentVersion}`);
      } else {
        statusEl.innerHTML = '<span class="badge success">版本一致</span>';
        addLog('状态检查', '版本匹配，不会触发通知');
      }
    });
  } catch (e) {
    addLog('错误', e.message);
  }
}

// 检查版本
document.getElementById('checkVersion').addEventListener('click', function() {
  addLog('用户操作', '点击"检查版本"');
  updateStatus();
});

// 打开更新页
document.getElementById('openUpdate').addEventListener('click', function() {
  addLog('用户操作', '手动打开更新页面');
  try {
    // 优先使用扩展保存的 ui_lang，然后回退到已有检测方式
    var openByLang = function(lang) {
      lang = (lang || 'en').toLowerCase();
      var target = (lang.indexOf('zh') === 0) ? 'update_zh.html' : 'update_en.html';
      var q = window.location.search || '';
      var h = window.location.hash || '';
      chrome.tabs.create({ url: chrome.runtime.getURL(target + q + h) });
      addLog('操作成功', '更新页面已在新标签页打开');
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('ui_lang', function(res) {
        try {
          if (res && res.ui_lang) {
            openByLang(res.ui_lang);
          } else {
            var lang = null;
            if (window.selected_ui_lang) {
              lang = window.selected_ui_lang;
            } else if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
              lang = chrome.i18n.getUILanguage();
            } else if (navigator && navigator.language) {
              lang = navigator.language;
            }
            openByLang(lang);
          }
        } catch (err) {
          addLog('错误', err.message);
        }
      });
    } else {
      var lang = window.selected_ui_lang || (navigator && navigator.language) || 'en';
      openByLang(lang);
    }
  } catch (e) {
    addLog('错误', e.message);
  }
});

// 模拟首次安装
document.getElementById('simulateNew').addEventListener('click', function() {
  addLog('用户操作', '模拟首次安装');
  chrome.storage.local.remove('lastSeenVersion', function() {
    addLog('操作成功', '版本记录已清除');
    setTimeout(updateStatus, 200);
    if (typeof $ !== 'undefined' && $.alert) {
      $.alert({
        title: '版本记录已清除！',
        content: '现在请执行以下操作之一：<br/>1. 重新加载扩展（推荐）<br/>2. 重启浏览器<br/>3. 点击扩展图标打开编辑器<br/><br/>应该会自动弹出更新通知页面。',
        type: 'blue'
      });
    } else {
      alert('已清除版本记录！\n\n现在请执行以下操作之一：\n1. 重新加载扩展（推荐）\n2. 重启浏览器\n3. 点击扩展图标打开编辑器\n\n应该会自动弹出更新通知页面。');
    }
  });
});

// 清除版本记录
document.getElementById('clearVersion').addEventListener('click', function() {
  if (typeof $ !== 'undefined' && $.confirm) {
    $.confirm({
      title: '确认清除',
      content: '确定要清除版本记录吗？<br/><br/>这将导致下次加载扩展时弹出更新通知。',
      type: 'orange',
      buttons: {
        confirm: {
          text: '确定',
          btnClass: 'btn-orange',
          action: function() {
            addLog('用户操作', '清除版本记录');
            chrome.storage.local.remove('lastSeenVersion', function() {
              addLog('操作成功', '版本记录已清除');
              setTimeout(updateStatus, 200);
            });
          }
        },
        cancel: {
          text: '取消'
        }
      }
    });
  } else {
    if (!confirm('确定要清除版本记录吗？\n\n这将导致下次加载扩展时弹出更新通知。')) {
      return;
    }
    addLog('用户操作', '清除版本记录');
    chrome.storage.local.remove('lastSeenVersion', function() {
      addLog('操作成功', '版本记录已清除');
      setTimeout(updateStatus, 200);
    });
  }
});

// 页面加载时更新状态
updateStatus();
addLog('页面初始化', '测试工具已加载');
