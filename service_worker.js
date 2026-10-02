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

// --- Update notification -------------------------------------------------
//
// Goals:
//   - Don't pop the update page every launch on machines where extension
//     storage was wiped (e.g. extension reload, dev mode, corrupted profile).
//   - Don't open multiple tabs if onInstalled fires more than once.
//   - Survive the user never pressing OK: seed lastSeenVersion the moment
//     the update page is opened, not only on the OK button.
//
// Strategy:
//   1. Read lastSeenVersion / lastUpdateDismissedAt from BOTH
//      chrome.storage.local AND chrome.storage.sync. Whichever has a value
//      wins. sync persists across reinstalls for signed-in users and is
//      much more durable on flaky profiles.
//   2. Suppress re-prompting for DISMISS_COOLDOWN_MS after the user has
//      dismissed it (or after we showed it once and they didn't click OK).
//      This protects against the "every-launch popup" failure mode.
//   3. Don't notify on onStartup at all: it fires on every browser launch
//      and was the main source of double-popups. onInstalled covers install
//      and update.
//   4. Skip if a tab for update.html / update_en.html / update_zh.html
//      is already open.
//   5. In-memory notified flag so onInstalled can't fire twice in the
//      same service-worker lifetime.

var DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
var UPDATE_PAGE_PATHS = ['update.html', 'update_en.html', 'update_zh.html'];
var notifiedThisLifetime = false;

function shouldNotifyVersionChange(oldVer, newVer) {
    function firstThree(v) {
        if (!v || typeof v !== 'string') return [0, 0, 0];
        var parts = v.split('.');
        var nums = [0, 0, 0];
        for (var i = 0; i < 3; i++) {
            var p = parts[i];
            if (typeof p === 'undefined') { nums[i] = 0; }
            else {
                var n = parseInt(p.replace(/[^0-9].*$/, ''), 10);
                nums[i] = isNaN(n) ? 0 : n;
            }
        }
        return nums;
    }
    var a = firstThree(oldVer);
    var b = firstThree(newVer);
    return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2];
}

function readMergedVersionState(cb) {
    // Reads from local and sync, prefers sync (more durable), merges.
    try {
        chrome.storage.sync.get(['lastSeenVersion', 'lastUpdateDismissedAt'], function (syncRes) {
            try {
                chrome.storage.local.get(['lastSeenVersion', 'lastUpdateDismissedAt'], function (localRes) {
                    var lastSeen = (syncRes && syncRes.lastSeenVersion) ||
                                   (localRes && localRes.lastSeenVersion) || null;
                    var dismissedAt = (syncRes && syncRes.lastUpdateDismissedAt) ||
                                      (localRes && localRes.lastUpdateDismissedAt) || 0;
                    cb({ lastSeenVersion: lastSeen, lastUpdateDismissedAt: dismissedAt });
                });
            } catch (e) {
                cb({ lastSeenVersion: (syncRes && syncRes.lastSeenVersion) || null,
                     lastUpdateDismissedAt: (syncRes && syncRes.lastUpdateDismissedAt) || 0 });
            }
        });
    } catch (e) {
        try {
            chrome.storage.local.get(['lastSeenVersion', 'lastUpdateDismissedAt'], function (localRes) {
                cb({ lastSeenVersion: (localRes && localRes.lastSeenVersion) || null,
                     lastUpdateDismissedAt: (localRes && localRes.lastUpdateDismissedAt) || 0 });
            });
        } catch (e2) {
            cb({ lastSeenVersion: null, lastUpdateDismissedAt: 0 });
        }
    }
}

function writeVersionState(patch, cb) {
    // Mirror to both storages so future reads from either succeed.
    var done = 0;
    function step() { done++; if (done >= 2 && cb) cb(); }
    try { chrome.storage.sync.set(patch, step); } catch (e) { step(); }
    try { chrome.storage.local.set(patch, step); } catch (e) { step(); }
}

function updateTabAlreadyOpen(cb) {
    try {
        chrome.tabs.query({}, function (tabs) {
            var found = false;
            for (var i = 0; i < tabs.length; i++) {
                var u = tabs[i] && tabs[i].url || '';
                for (var j = 0; j < UPDATE_PAGE_PATHS.length; j++) {
                    if (u.indexOf(UPDATE_PAGE_PATHS[j]) !== -1) { found = true; break; }
                }
                if (found) break;
            }
            cb(found);
        });
    } catch (e) {
        cb(false);
    }
}

function maybeShowUpdatePage(currentVersion) {
    if (notifiedThisLifetime) return;
    readMergedVersionState(function (state) {
        var lastVersion = state.lastSeenVersion;
        var dismissedAt = state.lastUpdateDismissedAt || 0;
        var now = Date.now();

        // Cooldown gate: if we've shown the page recently and the user hasn't
        // explicitly OK'd a new version, leave them alone. This protects the
        // "every-launch popup" failure mode when storage keeps losing state.
        if (dismissedAt && (now - dismissedAt) < DISMISS_COOLDOWN_MS &&
            (!lastVersion || !shouldNotifyVersionChange(lastVersion, currentVersion))) {
            return;
        }

        // No record at all: only show once per cooldown window.
        if (!lastVersion) {
            if (dismissedAt && (now - dismissedAt) < DISMISS_COOLDOWN_MS) return;
        } else if (!shouldNotifyVersionChange(lastVersion, currentVersion)) {
            return;
        }

        updateTabAlreadyOpen(function (alreadyOpen) {
            if (alreadyOpen) return;
            notifiedThisLifetime = true;
            // Mark dismissed-at immediately so a second concurrent install
            // event (or a rapid reload) doesn't pop again before the page
            // gets a chance to write lastSeenVersion.
            writeVersionState({ lastUpdateDismissedAt: now }, function () {
                chrome.tabs.create({ url: chrome.runtime.getURL('update.html') });
            });
        });
    });
}

chrome.runtime.onInstalled.addListener(function (details) {
    var manifest = chrome.runtime.getManifest();
    maybeShowUpdatePage(manifest.version);
});