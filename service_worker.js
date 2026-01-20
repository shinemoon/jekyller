/**
 * Listens for the app launching, then creates the window.
 * Basically just open the window by clicking
 *
 * @see http://developer.chrome.com/apps/app.runtime.html
 * @see http://developer.chrome.com/apps/app.window.html
 */

var user_info;	//git user info
var gh;					//git handler

var handleClick = function () {
    chrome.tabs.create({
        url: 'index.html'
    });
};

chrome.action.onClicked.addListener(handleClick);

// 版本更新检测 - 在扩展加载时检查
chrome.runtime.onInstalled.addListener(function(details) {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    // 检查存储的版本
    chrome.storage.local.get(['lastSeenVersion'], function(result) {
        const lastVersion = result.lastSeenVersion;
        // 如果没有存储版本，仍然打开更新页面（首次安装或未记录）
        if (!lastVersion) {
            chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
            return;
        }

        // 仅当版本的前3段（major.minor.patch）有差异时才触发更新通知
        if (shouldNotifyVersionChange(lastVersion, currentVersion)) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('update.html')
            });
        }
    });
});

// 也在启动时检查（适用于后台加载场景）
chrome.runtime.onStartup.addListener(function() {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    
    chrome.storage.local.get(['lastSeenVersion'], function(result) {
        const lastVersion = result.lastSeenVersion;
        if (!lastVersion) {
            chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
            return;
        }

        if (shouldNotifyVersionChange(lastVersion, currentVersion)) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('update.html')
            });
        }
    });
});

// Helper: compare first three numeric segments of semver-like version strings
function shouldNotifyVersionChange(oldVer, newVer) {
    function firstThree(v) {
        if (!v || typeof v !== 'string') return [0,0,0];
        const parts = v.split('.');
        const nums = [0,0,0];
        for (let i = 0; i < 3; i++) {
            const p = parts[i];
            if (typeof p === 'undefined') { nums[i] = 0; }
            else {
                const n = parseInt(p.replace(/[^0-9].*$/,''), 10);
                nums[i] = isNaN(n) ? 0 : n;
            }
        }
        return nums;
    }

    const a = firstThree(oldVer);
    const b = firstThree(newVer);
    return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2];
}
