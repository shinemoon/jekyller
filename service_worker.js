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
        
        // 如果没有存储版本或版本不同，打开更新页面
        if (!lastVersion || lastVersion !== currentVersion) {
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
        
        if (!lastVersion || lastVersion !== currentVersion) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('update.html')
            });
        }
    });
});
